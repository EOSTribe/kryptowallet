import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  KHeader,
  KButton,
  KText,
  KInput,
  OneIconButton,
  TwoIconsButtons,
  GasOptions,
} from '../../components';
import styles from './AccountDetailsScreen.style';
import TransactionListItem from './components/TransactionListItem';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { log } from '../../logger/logger';
import web3Module from '../../ethereum/ethereum';

const tokenABI = require('../../ethereum/abi.json');

const ERC20TokenDetailsScreen = props => {
  const [tokenBalance, setTokenBalance] = useState(0);
  const [toAccountName, setToAccountName] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [amount, setAmount] = useState('');
  const [addressInvalidMessage, setAddressInvalidMessage] = useState();

  const nativeDivider = 1000000000000000000;
  const [gasPrice, setGasPrice] = useState(20000000000);
  const [gasLimit, setGasLimit] = useState(300000);
  const [estimatedFee, setEstimatedFee] = useState(0.0);
  const [loading, setLoading] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState(false);
  const [previewTransfer, setPreviewTransfer] = useState(false);

  const {
    navigation: { navigate, goBack },
    route: {
      params: { account: account, token: token },
    },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const {
    getCurrentGasPrice,
    getCurrentTokenGasLimit,
    getBalanceOfAccount,
    getBalanceOfTokenOfAccount,
    transterERC20
  } = web3Module({
    tokenABI,
    tokenAddress: token.address,
    decimals: token.decimals
  });

  const _handleToAccountChange = value => {
    // trim white space if present:
    if (value.indexOf(' ') >= 0) {
      value = value.trim();
    }

    setToAccountName(value);
  };

  const refreshBalances = async () => {
    const balance = await getBalanceOfTokenOfAccount(account.chainName, account.address);
    setTokenBalance(balance);
    setShowTransfer(true);
  };

  const _handlePressTransaction = trans => {

  };

  const getSubtitle = () => {
    return token.name + ' on ' + (account.chainName === 'AURORA' ? 'ETH': account.chainName);
  };

  const _handleTransfer = async () => {
    setLoading(true);

    if (!account || !toAccountName || !amount) {
      Alert.alert(
        'Please select from and to account as well as amount for transfer',
      );
      setLoading(false);
      return;
    }

    // Validate amount:
    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Please input valid amount');
      setLoading(false);
      return;
    }

    prepareTransfer(account, floatAmount);
    setLoading(false);
  };

  const prepareTransfer = async (from, floatAmount) => {
    try {
      if (tokenBalance < floatAmount) {
        Alert.alert('Insufficient balance to send transfer!');
      } else {
        const gasLimitation = await getCurrentTokenGasLimit(from.chainName, account, floatAmount.toString(), toAccountName);
        setGasLimit(gasLimitation);

        const gasValue = await getCurrentGasPrice(from.chainName);
        setGasPrice(gasValue);
        const nativeBalanceInWei = await getBalanceOfAccount(from.chainName, from.address);
        const nativeBalanceInEth = parseFloat(nativeBalanceInWei / nativeDivider).toFixed(4);
        const estimatedFee = parseFloat((gasValue * gasLimitation) / nativeDivider).toFixed(4);
        setEstimatedFee(estimatedFee);

        if (nativeBalanceInEth < estimatedFee) {
          Alert.alert('Not enough ETH for transfer cost (gas)!');
        } else {
          setPreviewTransfer(true);
        }
      }
    } catch (error) {
      console.log("error:", error);
    }
  }

  const sendTransfer = async () => {
    if (pendingTransfer) {
      Alert.alert(`Waiting for pending ${token.name} transfer!`);
      return;
    }

    setPendingTransfer(true);
    try {
      await transterERC20(account.chainName, account, toAccountName, amount, gasLimit, gasPrice);
      Alert.alert(`${token.name} Transfer submitted!`);
    } catch (error) {
      Alert.alert(`${token.name} Transfer error!`);
    }
    setPendingTransfer(false);
    setPreviewTransfer(false);
  };

  const rejectTransfer = () => {
    setPreviewTransfer(false);
  }

  const getTransferFormLabel = () => {
    return 'Transfer ' + token.name + ' tokens: ';
  };

  useEffect(() => {
    if (previewTransfer === false) {
      refreshBalances();
    }
  }, [previewTransfer])

  useEffect(() => {
    refreshBalances();
  }, [])

  if (showTransfer) {
    if (previewTransfer) {
      return (
        <SafeAreaView style={styles.container}>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContentContainer}
            enableOnAndroid>
            <View style={styles.inner}>
              <KHeader
                title={'Transfer'}
                style={styles.header}
              />
              <KText>From: {account.address}</KText>
              <KText>To: {toAccountName}</KText>
              <KText>Amount: {amount} {token.name} on {account.chainName === 'AURORA' ? 'ETH': account.chainName}</KText>
              <KText>Gas fee: {estimatedFee} {account.chainName === 'AURORA' ? 'ETH': account.chainName} (Estimated)</KText>
              <KText>Balance: {tokenBalance} {token.name}</KText>
              {/* <View style={styles.gasOption}>
                <KText style={styles.label}> Gas option: </KText>
                <GasOptions />
              </View> */}
              <View style={styles.autoSpacer} />
              <TwoIconsButtons
                onIcon1Press={sendTransfer}
                onIcon2Press={rejectTransfer}
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
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      );
    } else {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.inner}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <MaterialIcon
                name={'keyboard-backspace'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
            <KHeader
              title={account.accountName}
              subTitle={getSubtitle()}
              style={styles.header}
            />
            <KText>Balance: {tokenBalance}</KText>
            <KInput
              label={getTransferFormLabel()}
              placeholder={'Enter receiver account name'}
              value={toAccountName}
              onChangeText={_handleToAccountChange}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
            />
            <KText style={styles.errorMessage}>{addressInvalidMessage}</KText>
            <KInput
              label={'Amount to send'}
              placeholder={'Enter amount to send'}
              value={amount}
              onChangeText={setAmount}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
              keyboardType={'numeric'}
            />
            <KButton
              title={'Submit transfer'}
              theme={'blue'}
              style={styles.button}
              isLoading={loading}
              onPress={_handleTransfer}
            />
            <View style={styles.spacer} />
            <OneIconButton
              onIconPress={() => setShowTransfer(false)}
              icon={() => (
                <Image
                  source={require('../../../assets/icons/history.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
          </View>
        </SafeAreaView>
      );
    }
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <MaterialIcon
              name={'keyboard-backspace'}
              size={24}
              color={PRIMARY_BLUE}
            />
          </TouchableOpacity>
          <KHeader
            title={account.accountName}
            subTitle={getSubtitle()}
            style={styles.header}
          />
          <KText>Balance: {tokenBalance}</KText>
          <FlatList
            data={transactions}
            keyExtractor={(item, index) => `${index}`}
            renderItem={({ item, index }) => (
              <TransactionListItem
                transaction={item}
                style={styles.listItem}
                onPress={() => _handlePressTransaction(item)}
              />
            )}
          />
        </View>
      </SafeAreaView>
    );
  }
};

export default connectAccounts()(ERC20TokenDetailsScreen);
