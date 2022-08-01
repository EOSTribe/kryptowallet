import React, { useState, useEffect } from 'react';
import { PieChart } from 'react-native-chart-kit';
import {
  SafeAreaView,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Clipboard,
  Image,
  Text,
  Alert,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { TwoIconsButtons, KText, KButton } from '../../components';
import styles from '../Ethereum/EthereumAccountScreen.style';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import web3Module, { web3AuroraStakingModule } from '../../ethereum/ethereum';
import { log } from '../../logger/logger';
import { MAIN_PAGE, SECOND_PAGE } from '../../constant/page'

const ethMultiplier = 1000000000000000000;
const tokenABI = require('../../ethereum/abi.json');
const tokenAddress = "0x8BEc47865aDe3B172A928df8f990Bc7f2A3b9f79";
const {
  getCurrentGasPrice,
  getBalanceOfAccount
} = web3Module({
  tokenABI,
  tokenAddress,
  decimals: 18
});

const {
  getWithdrawLockTime,
  getWithdrawals,
  withdrawAll,
  getWithdrawAllGasLimit,
} = web3AuroraStakingModule();

const AuroraWithdrawScreen = props => {
  const {
    navigation: { navigate, goBack },
    route: {
      params: { account: account },
    },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const [showFlag, setShowFlag] = useState(MAIN_PAGE);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [gasPrice, setGasPrice] = useState(70000000);
  const [gasLimit, setGasLimit] = useState(6721975);
  const [estimatedFee, setEstimatedFee] = useState(0.0);

  const nativeDivider = 1000000000000000000;
  const [accountBalance, setAccountBalance] = useState();
  const [unlockedTime, setUnlockedTime] = useState(1);

  const [pendings, setPendings] = useState([0, 0, 0, 0, 0])

  // Stake chart data:
  const stakeData = [
    {
      name: 'AURORA',
      balance: parseFloat(pendings[0]),
      color: 'rgba(42, 254, 106, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'PLY',
      balance: parseFloat(pendings[1]),
      color: '#169545',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'TRI',
      balance: parseFloat(pendings[2]),
      color: '#aa21b9',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'BSTN',
      balance: parseFloat(pendings[3]),
      color: '#0f837a',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'USN',
      balance: parseFloat(pendings[4]),
      color: '#1b474c',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }
  ];

  const screenWidth = Dimensions.get('window').width;
  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 5, // optional, defaults to 2dp
    color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  useEffect(() => {
    const name = "AURORA:" + account.accountName;
    for (const elem of totals) {
      if (elem.account === name) {
        setUsdValue(elem.total);
        break;
      }
    }
  }, [totals]);

  useEffect(() => {
    loadEthereumAccountBalance(account);
  }, [account])

  const copyToClipboard = () => {
    Clipboard.setString(account.address);
    Alert.alert('Address copied to Clipboard');
  };

  const loadEthereumAccountBalance = async account => {
    try {
      const ethBalanceInGwei = await getBalanceOfAccount("AURORA", account.address);
      const ethBalanceInEth = ethBalanceInGwei / ethMultiplier;
      setAccountBalance(parseFloat(ethBalanceInEth).toFixed(4));

      const remainTime = await getWithdrawLockTime(account);
      setUnlockedTime(remainTime);

      const withdrawals = await getWithdrawals(account);
      setPendings(withdrawals);

      setLoading(false);
    } catch (err) {
      log({
        description: 'loadEthereumAccountBalance',
        cause: err,
        location: 'AuroraAccountScreen',
      });
      return;
    }
  };

  const _handleWithdrawAll = async () => {
    if(loading) {
      Alert.alert(`Loading...`);
      return;
    }
    
    if (unlockedTime > 0) {
      Alert.alert(`The withdrawals is locked for ${Math.ceil(unlockedTime / 3600 / 24)} days!`);
      return;
    }

    setShowFlag(SECOND_PAGE);
    const gasValue = await getCurrentGasPrice("AURORA");
    setGasPrice(gasValue);

    const gasLimitation = await getWithdrawAllGasLimit(account);
    setGasLimit(gasLimitation);

    const estimatedFee = parseFloat((gasValue * gasLimitation) / nativeDivider).toFixed(6);
    setEstimatedFee(estimatedFee);
  };

  const withdraw = async () => {
    if (pending) {
      Alert.alert(`Waiting for pending All rewards withdrawal!`);
      return;
    }

    setPending(true);
    try {
      let ret = await withdrawAll(account, gasLimit, gasPrice);
      if (ret !== []) {
        setTimeout(() => loadEthereumAccountBalance(account), 1000)
        Alert.alert(`All rewards withdrawn!`);
      }
      else {
        Alert.alert(`Failed withdrawal!`);
      }
    } catch (error) {
      Alert.alert(`Withdraw error!`);
    }
    setShowFlag(MAIN_PAGE);
    setPending(false);
  }

  const reject = async () => {
    setShowFlag(MAIN_PAGE);
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.moreInner}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <MaterialIcon
            name={'keyboard-backspace'}
            size={35}
            color={PRIMARY_BLUE}
          />
        </TouchableOpacity>
        <View style={styles.spacer} />
        <View style={styles.column}>
          <Image
            source={require('../../../assets/chains/aurora.png')}
            style={styles.buttonIcon}
          />
          <Text style={styles.addressLink} onPress={copyToClipboard}>
            {account.address}
          </Text>
        </View>
        <View style={styles.spacer} />
        <KText>Balance: {accountBalance} ETH</KText>
        {unlockedTime > 0 ?
          <KText>Available in: {Math.ceil(unlockedTime / 3600 / 24)} days</KText>
          :
          <KText>All withdrawals Availabled</KText>
        }
        {showFlag === SECOND_PAGE &&
          <>
            <KText>Estimated Gas Fee: {estimatedFee} ETH</KText>
            <View style={styles.spacer} />
            <KText style={styles.link}>Earned Rewards</KText>
            <KText>AURORA Rewards: {pendings[0]} AURORA</KText>
            <KText>Aurigami Rewards: {pendings[1]} PLY</KText>
            <KText>Trisolaris Rewards: {pendings[2]} TRI</KText>
            <KText>Bastion Rewards: {pendings[3]} BSTN</KText>
            <KText>USN Rewards: {pendings[4]} USN</KText>
          </>
        }
        <View style={styles.spacerToBottom} />
        {showFlag === MAIN_PAGE &&
          <ScrollView showsVerticalScrollIndicator={false}>
            <PieChart
              data={stakeData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="balance"
              backgroundColor="transparent"
              absolute
            />
            <KButton
              title={'Withdraw all'}
              theme={'blue'}
              style={styles.button}
              onPress={_handleWithdrawAll}
            />
            <View style={styles.spacer} />
          </ScrollView>
        }
        {showFlag === SECOND_PAGE &&
          <TwoIconsButtons
            onIcon1Press={withdraw}
            onIcon2Press={reject}
            icon1={() => (
              <Image
                source={require('../../../assets/icons/confirm.png')}
                style={styles.buttonIcon}
              />
            )}
            icon2={() => (
              <Image
                source={require('../../../assets/icons/close.png')}
                style={styles.buttonIcon}
              />
            )}
          />
        }
      </View>
    </SafeAreaView >
  );
};

export default connectAccounts()(AuroraWithdrawScreen);
