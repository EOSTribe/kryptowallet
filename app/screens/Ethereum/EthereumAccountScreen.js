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
import { KHeader, KText, KButton, TwoIconsButtons } from '../../components';
import styles from './EthereumAccountScreen.style';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { findIndex } from 'lodash';
import { getEndpoint } from '../../eos/chains';
import web3Module from '../../ethereum/ethereum';
import Wallet from 'ethereumjs-wallet';
import { log } from '../../logger/logger';

const ethMultiplier = 1000000000000000000;
const tokenABI = require('../../ethereum/abi.json');
const tokenAddress = "";
const {
  getBalanceOfAccount,
  } = web3Module({
    tokenABI,
    tokenAddress,
    decimals: 18
  });


const EthereumAccountScreen = props => {
  const [accountBalance, setAccountBalance] = useState();
  const [connectedHeader, setConnectedHeader] = useState('');
  const [connectedAddress, setConnectedAddress] = useState('');
  const [loaded, setLoaded] = useState(false);

  const {
    navigation: { navigate, goBack },
    route: {
      params: { account: account },
    },
    deleteAccount,
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const divider = 1000000;
  const fioEndpoint = getEndpoint('FIO');
  // var runOnce = 0;
  const name =  "ETH:" + account.accountName;
  var usdValue = 0;
  for (const elem of totals) {
    if(elem.account===name) {
      usdValue = elem.total;
      break;
    }
  }

  const copyToClipboard = () => {
    Clipboard.setString(account.address);
    Alert.alert('Address copied to Clipboard');
  };

  const checkEthereumAddress = (fioaccount, ethAddress) => {
    if (loaded) {
      return;
    }
    if (ethAddress === account.address) {
      if (connectedHeader === '') {
        setConnectedHeader('Connected to FIO address:');
      }
      if (connectedAddress === '') {
        setConnectedAddress(fioaccount.address);
      }
    }
  };

  const checkConnectedFIOAccounts = async () => {
    if (loaded) {
      return;
    }
    // Check if connected to any local FIO address:
    accounts.map((value, index, self) => {
      if (value.chainName === 'FIO' && value.address) {
        setLoaded(true);
        fetch(fioEndpoint + '/v1/chain/get_pub_address', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fio_address: value.address,
            chain_code: 'ETH',
            token_code: 'ETH',
          }),
        })
          .then(response => response.json())
          .then(json => checkEthereumAddress(value, json.public_address))
          .catch(error =>
            log({
              description:
                'checkConnectedFIOAccounts - fetch ' +
                fioEndpoint +
                '/v1/chain/get_pub_address',
              cause: error,
              location: 'EthereumAccountScreen',
            }),
          );
      }
    });
  };


  const loadEthereumAccountBalance = async account => {
    if (loaded) {
      return;
    }
    try {
      const ethBalanceInGwei = await getBalanceOfAccount("ETH", account.address);
      const ethBalanceInEth = ethBalanceInGwei/ethMultiplier;
      setAccountBalance(parseFloat(ethBalanceInEth).toFixed(4));
      checkConnectedFIOAccounts();
    } catch (err) {
      log({
        description: 'loadEthereumAccountBalance',
        cause: err,
        location: 'EthereumAccountScreen',
      });
      return;
    } finally {
      setLoaded(true);
    }
  };

  const _handleDeleteAccount = index => {
    deleteAccount(index);
    goBack();
  };

  const _handleRemoveAccount = () => {
    const index = findIndex(
      accounts,
      el =>
        el.address === account.address &&
        el.chainName === account.chainName,
    );
    Alert.alert(
      'Delete Ethereum Account',
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

  const _handlePressAccount = index => {
    const fioAccount = connectedAccounts[index];
    navigate('FIOAddressActions', { fioAccount });
  };

  const _handleTransfer = () => {
    navigate('Transfer', { account });
  };

  loadEthereumAccountBalance(account);

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
        <Image
          source={require('../../../assets/chains/eth.png')}
          style={styles.buttonIcon}
        />
        <View style={styles.spacer} />
        <KText>Balance: {accountBalance} ETH</KText>
        <KText>USD Value: ${usdValue}</KText>
        <Text style={styles.link} onPress={copyToClipboard}>
          {account.address}
        </Text>
        <View style={styles.spacer} />
        <View style={styles.qrcode}>
          <QRCode value={account.address} size={200} />
        </View>
        <KText>{connectedHeader}</KText>
        <KText>{connectedAddress}</KText>
        <FlatList />
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
      </View>
    </SafeAreaView>
  );
};

export default connectAccounts()(EthereumAccountScreen);
