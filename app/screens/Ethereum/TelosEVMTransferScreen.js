import React, { useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import {
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  Clipboard,
  Image,
  Text,
  Alert,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KHeader, KText, KButton, KInput, KSelect, TwoIconsButtons, FiveIconsButtons } from '../../components';
import styles from './EthereumAccountScreen.style';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { findIndex } from 'lodash';
import { getChain, getEndpoint } from '../../eos/chains';
import web3Module from '../../ethereum/ethereum';
import Wallet from 'ethereumjs-wallet';
import { log } from '../../logger/logger';
import { getAccount } from '../../eos/eos';
import { transferTelosToEVM } from '../../eos/telosevm';


const ethMultiplier = 1000000000000000000;
const tokenABI = require('../../ethereum/abi.json');
const tokenAddress = "";
const {
  getBalanceOfAccount
  } = web3Module({
    tokenABI,
    tokenAddress,
    decimals: 18
  });


const TelosEVMTransferScreen = props => {
  const [nativeAccount, setNativeAccount] = useState();
  const [accountBalance, setAccountBalance] = useState();
  const [nativeAccountBalance, setNativeAccountBalance] = useState();
  const [connectedHeader, setConnectedHeader] = useState('');
  const [connectedAddress, setConnectedAddress] = useState('');
  const [loaded, setLoaded] = useState(false);

  const [amount, setAmount] = useState('');

  const {
    navigation: { navigate, goBack },
    route: {
      params: { account: account },
    },
    deleteAccount,
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const divider = 1000000;

  const telosAccounts = accounts.filter((value, index, array) => {
    return (value != null && value.chainName === 'Telos');
  });
  
  const loadNativeAccountBalance = async (account) => {
  	const chain = getChain(account.chainName);
  	if (!chain) {
    	return;
  	}
  	try {
    	const accountInfo = await getAccount(account.accountName, chain);
    	console.log(accountInfo);
    	// Calculate balance:
    	var selfUnstaked = 0;
    	if (accountInfo.core_liquid_balance) {
    	  token = accountInfo.core_liquid_balance.split(' ')[1];
    	  selfUnstaked = parseFloat(accountInfo.core_liquid_balance.split(' ')[0]);
    	}
    	setNativeAccountBalance(selfUnstaked.toFixed(4));
  	} catch (err) {
    	log({
    	  description: 'loadNativeAccountBalance',
    	  cause: err,
    	  location: 'TelosEVMTransferScreen',
    	});
    	return;
  	}
  };

  const loadEVMAccountBalance = async account => {
    if (loaded) {
      return;
    }
    try {
      const ethBalanceInGwei = await getBalanceOfAccount("TELOSEVM", account.address);
      const ethBalanceInEth = ethBalanceInGwei/ethMultiplier;
      const accBalance = parseFloat(ethBalanceInEth).toFixed(4);
      console.log(accBalance);
      setAccountBalance(accBalance);
    } catch (err) {
      log({
        description: 'loadEVMAccountBalance',
        cause: err,
        location: 'TelosEVMTransferScreen',
      });
      return;
    } finally {
      setLoaded(true);
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(account.address);
    Alert.alert('Address copied to Clipboard');
  };

  const _handleFromAccountChange = value => {
  	if(value) {
  		setNativeAccount(value);
		loadNativeAccountBalance(value);
	}
  };

  const validateAmount = amt => {
  	try {
  		let amount = parseFloat(amt);
  		let balance = parseFloat(nativeAccountBalance);
  		if(amount < 0) {
  			Alert.alert("Enter non negative amount");
  			return;
  		}
  		if(amount > balance) {
  			Alert.alert("Transfer amount can't exceed available native balance");
  			return;
  		}
  		setAmount(amt);
  	} catch(err) {
  		Alert.alert("Bad amount "+amt);
  	}
  };

  const _handleTransfer = () => {

  }

  loadEVMAccountBalance(account);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
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
          source={require('../../../assets/chains/telosevm.png')}
          style={styles.buttonIcon}
        />
        <Text style={styles.addressLink} onPress={copyToClipboard}>
          {account.address}
        </Text>
        </View>
        <View style={styles.spacer} />
        <KText>TLOS EVM Balance: {accountBalance} TLOS</KText>
        <View style={styles.spacer} />
        <KSelect
              label={'From native Telos account'}
              items={telosAccounts.map(item => ({
                label: item.accountName,
                value: item,
              }))}
              onValueChange={_handleFromAccountChange}
              containerStyle={styles.inputContainer}
            />
        <KInput
              label={'Amount to send'}
              placeholder={'Enter amount to send'}
              value={amount}
              onChangeText={validateAmount}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
              keyboardType={'numeric'}
            />
        <KText>Available native balance: {nativeAccountBalance} TLOS</KText>
        <View style={styles.spacer} />
        <KButton
              title={'Transfer'}
              theme={'blue'}
              style={styles.button}
              onPress={_handleTransfer}
            />
      </View>
    </SafeAreaView>
  );


};

export default connectAccounts()(TelosEVMTransferScreen);
