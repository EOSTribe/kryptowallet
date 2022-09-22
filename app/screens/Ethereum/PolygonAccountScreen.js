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
import { KHeader, KText, KButton, TwoIconsButtons, FiveIconsButtons } from '../../components';
import styles from './EthereumAccountScreen.style';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { findIndex } from 'lodash';
import { getEndpoint } from '../../eos/chains';
import web3Module from '../../ethereum/ethereum';
import Wallet from 'ethereumjs-wallet';
import { log } from '../../logger/logger';
import { getEVMTokenByName } from '../../ethereum/tokens';

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


const PolygonAccountScreen = props => {
  const [accountBalance, setAccountBalance] = useState();
  const [connectedHeader, setConnectedHeader] = useState('');
  const [connectedAddress, setConnectedAddress] = useState('');
  const [loaded, setLoaded] = useState(false);

  const [totalUsdValue, setTotalUsdValue] = useState(0.0);
  const [usdtBalance, setUsdtBalance] = useState(0.0);
  const [usdcBalance, setUsdcBalance] = useState(0.0);

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
  
  const refreshTotalUsdValue = async () => {
    var usdValue = 0.0;
    const name =  "MATIC:" + account.address;
    for (const elem of totals) {
      if(elem.account === name) {
        usdValue = elem.total;
        break;
      }
    }
    const totalUsd = ( parseFloat(usdValue) + parseFloat(usdtBalance) + parseFloat(usdcBalance) ).toFixed(2);
    setTotalUsdValue(totalUsd);
  }

  const loadTokenBalance = async (token, setTokenBalance) => {
    if(!token) return;
    const { getBalanceOfTokenOfAccount } = web3Module({
          tokenABI,
          tokenAddress: token.address,
          decimals: token.decimals
        });
    const tokenBalance = await getBalanceOfTokenOfAccount(token.symbol, account.address);
    console.log(tokenBalance, token.symbol);
    setTokenBalance(tokenBalance);
    refreshTotalUsdValue();
  }

  // Load USDT Balance:
  const usdtToken = getEVMTokenByName('MATIC', 'USDT');
  loadTokenBalance(usdtToken, setUsdtBalance);

  // Load USDC Balance:
  const usdcToken = getEVMTokenByName('MATIC', 'USDC');
  loadTokenBalance(usdcToken, setUsdcBalance);

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
            chain_code: 'MATIC',
            token_code: 'MATIC',
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
              location: 'PolygonAccountScreen',
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
      const ethBalanceInGwei = await getBalanceOfAccount("MATIC", account.address);
      const ethBalanceInEth = ethBalanceInGwei/ethMultiplier;
      setAccountBalance(parseFloat(ethBalanceInEth).toFixed(4));
      checkConnectedFIOAccounts();
    } catch (err) {
      log({
        description: 'loadEthereumAccountBalance',
        cause: err,
        location: 'PolygonAccountScreen',
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
      'Delete Polygon Account',
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
        <View style={styles.column}>
        <Image
          source={require('../../../assets/chains/polygon.png')}
          style={styles.buttonIcon}
        />
        <Text style={styles.addressLink} onPress={copyToClipboard}>
          {account.address}
        </Text>
        </View>
        <View style={styles.spacer} />
        <KText>MATIC Balance: {accountBalance} MATIC</KText>
        { usdtBalance > 0 &&
          <KText>USDT Balance: {usdtBalance}</KText>
        }
        { usdcBalance > 0 &&
          <KText>USDC Balance: {usdcBalance}</KText>
        }
        <KText>Total USD Value: ${totalUsdValue}</KText>
        <View style={styles.spacer} />
        <View style={styles.qrcode}>
          <QRCode value={account.address} size={150} />
        </View>
        <KText>{connectedHeader}</KText>
        <KText>{connectedAddress}</KText>
        <KText>Switch network:</KText>
        <FiveIconsButtons
          onIcon1Press={()=>navigate('EthereumAccount', { account })}
          onIcon2Press={()=>navigate('PolygonAccount', { account })}
          onIcon3Press={()=>navigate('AuroraAccount', { account })}
          onIcon4Press={()=>navigate('BinanceAccount', { account })}
          onIcon5Press={()=>navigate('TelosEVMAccount', { account })}
          icon1={() => (
            <Image
              source={require('../../../assets/chains/eth.png')}
              style={styles.buttonIcon}
            />
          )}
          icon2={() => (
            <Image
              source={require('../../../assets/chains/polygon.png')}
              style={styles.buttonIcon}
            />
          )}
          icon3={() => (
            <Image
              source={require('../../../assets/chains/aurora.png')}
              style={styles.buttonIcon}
            />
          )}
          icon4={() => (
            <Image
              source={require('../../../assets/chains/bsc.png')}
              style={styles.buttonIcon}
            />
          )}
          icon5={() => (
            <Image
              source={require('../../../assets/chains/telosevm.png')}
              style={styles.buttonIcon}
            />
          )}
        />
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

export default connectAccounts()(PolygonAccountScreen);
