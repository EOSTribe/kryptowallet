import React, { useState, useEffect } from 'react';
import { PieChart } from 'react-native-chart-kit';
import {
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Clipboard,
  Image,
  Text,
  Alert,
  ScrollView,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KText, KButton, TwoIconsButtons } from '../../components';
import styles from './EthereumAccountScreen.style';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { findIndex } from 'lodash';
import { AURORA_STAKING_ADDRESS } from '../../constant/address';
import web3Module, { web3AuroraStakingModule, AURORA_STREAM_NUM } from '../../ethereum/ethereum';
import { log } from '../../logger/logger';
import { MAIN_PAGE, SECOND_PAGE } from '../../constant/page'

const ethMultiplier = 1000000000000000000;
const tokenABI = require('../../ethereum/abi.json');
const tokenAddress = "0x8BEc47865aDe3B172A928df8f990Bc7f2A3b9f79";
const {
  getBalanceOfAccount,
  getBalanceOfTokenOfAccount,
  getCurrentGasPrice,
  getAllowance,
  getApproveGasLimit,
  approve,
} = web3Module({
  tokenABI,
  tokenAddress,
  decimals: 18
});

const {
  getAprs,
} = web3AuroraStakingModule();

const AuroraAccountScreen = props => {
  const {
    navigation: { navigate, goBack },
    route: {
      params: { account: account },
    },
    deleteAccount,
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const [showFlag, setShowFlag] = useState(MAIN_PAGE);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [gasPrice, setGasPrice] = useState(70000000);
  const [gasApproveLimit, setGasApproveLimit] = useState(0);
  const [estimatedFee, setEstimatedFee] = useState(0.0);

  const nativeDivider = 1000000000000000000;
  const [accountBalance, setAccountBalance] = useState();
  const [availableBalance, setAvailableBalance] = useState();
  const [allowance, setAllowance] = useState(0);

  const [aprTotal, setAprTotal] = useState(0);
  const [stakingAprs, setStakingAprs] = useState([0, 0, 0, 0, 0]);

  // Stake chart data:
  const stakeData = [
    {
      name: '% (AURORA)',
      balance: parseFloat(stakingAprs[0]),
      color: 'rgba(42, 254, 106, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: '% (PLY)',
      balance: parseFloat(stakingAprs[1]),
      color: '#169545',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: '% (TRI)',
      balance: parseFloat(stakingAprs[2]),
      color: '#aa21b9',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: '% (BSTN)',
      balance: parseFloat(stakingAprs[3]),
      color: '#0f837a',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: '% (USN)',
      balance: parseFloat(stakingAprs[4]),
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
    decimalPlaces: 2, // optional, defaults to 2dp
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

      const auroraBalance = await getBalanceOfTokenOfAccount("AURORA", account.address);
      setAvailableBalance(parseFloat(auroraBalance).toFixed(4));

      const aprs = await getAprs();
      if (aprs.length === AURORA_STREAM_NUM) {
        setStakingAprs(aprs);
        const totalApr = aprs.reduce((pv, cv) => parseFloat(pv) + parseFloat(cv), 0);
        setAprTotal(Math.floor(totalApr));
      }

      const allowanceAmount = await getAllowance("AURORA", account.address, AURORA_STAKING_ADDRESS);
      setAllowance(allowanceAmount);

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

  const _handleApprove = async () => {
    if(loading) {
      Alert.alert(`Loading...`);
      return;
    }

    if (parseFloat(accountBalance) === 0) {
      Alert.alert(`Please charge ETH to approve Your wallet!`);
      return;
    }

    setShowFlag(SECOND_PAGE);
    const gasValue = await getCurrentGasPrice("AURORA");
    setGasPrice(gasValue);

    const gasLimitation = await getApproveGasLimit("AURORA", account, AURORA_STAKING_ADDRESS, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    setGasApproveLimit(gasLimitation);

    const estimatedFee = parseFloat((gasValue * gasLimitation) / nativeDivider).toFixed(6);
    setEstimatedFee(estimatedFee);
  }

  const _handleDeleteAccount = index => {
    deleteAccount(index);
    goBack();
  };

  const approveStaking = async () => {
    if (pending) {
      Alert.alert(`Waiting for pending approval!`);
      return;
    }

    setPending(true);
    try {
      let ret = await approve("AURORA", account, AURORA_STAKING_ADDRESS, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", gasApproveLimit, gasPrice);
      if (ret !== []) {
        setTimeout(() => loadEthereumAccountBalance(account), 1000)
        Alert.alert(`Approved!`);
      }
      else {
        Alert.alert(`Failed Approval!`);
      }
    } catch (error) {
      Alert.alert(`Approve error!`);
    }
    setShowFlag(MAIN_PAGE);
    setPending(false);
  }

  const reject = async () => {
    setShowFlag(MAIN_PAGE);
  }

  const _handleRemoveAccount = () => {
    const index = findIndex(
      accounts,
      el =>
        el.address === account.address &&
        el.chainName === account.chainName,
    );
    Alert.alert(
      'Delete Aurora Account',
      'Are you sure you want to delete this account?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Delete account cancelled'),
          style: 'cancel',
        },
        { text: 'OK', onPress: () => _handleDeleteAccount(index) },
      ],
      { cancelable: false },
    );
  };

  const _handleBackupKey = () => {
    navigate('PrivateKeyBackup', { account });
  };

  const _handlePressStake = () => {
    navigate('AuroraStake', { account });
  };

  const _handlePressUnstake = () => {
    navigate('AuroraUnstake', { account });
  };

  const _handlePressWithdraw = () => {
    navigate('AuroraWithdraw', { account });
  };

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
        <KText>Available: {availableBalance} AURORA</KText>
        <KText>Total APR: {aprTotal} %</KText>
        {showFlag === SECOND_PAGE &&
          <KText>Estimated Gas Fee: {estimatedFee} ETH</KText>
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
            {allowance > 0 ?
              <>
                <View style={styles.buttonColumn}>
                  <KButton
                    title={'Stake AURORA'}
                    theme={'blue'}
                    style={styles.smallButton}
                    onPress={_handlePressStake}
                  />
                  <KButton
                    title={'Unstake AURORA'}
                    theme={'brown'}
                    style={styles.smallButton}
                    onPress={_handlePressUnstake}
                  />
                </View>
                <KButton
                  title={'5 withdrawals in cooldown'}
                  theme={'blue'}
                  style={styles.button}
                  onPress={_handlePressWithdraw}
                />
              </>
              :
              <KButton
                title={'Approve'}
                theme={'blue'}
                style={styles.button}
                onPress={_handleApprove}
              />
            }
            <TwoIconsButtons
              onIcon1Press={_handleBackupKey}
              onIcon2Press={_handleRemoveAccount}
              icon1={() => (
                <Image
                  source={require('../../../assets/icons/save_key.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon2={() => (
                <Image
                  source={require('../../../assets/icons/delete.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
          </ScrollView>
        }
        {showFlag === SECOND_PAGE &&
          <TwoIconsButtons
            onIcon1Press={approveStaking}
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
    </SafeAreaView>
  );
};

export default connectAccounts()(AuroraAccountScreen);
