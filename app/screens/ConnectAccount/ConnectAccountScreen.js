import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ecc } from '@fioprotocol/fiojs';
import ecc from 'eosjs-ecc-rn';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './ConnectAccountScreen.style';
import { KHeader, KButton, KInput, KSelect } from '../../components';
import { supportedChains, getChain, getEndpoint } from '../../eos/chains';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { getAccount } from '../../eos/eos';
import { loadAccount, getKeyPair } from '../../stellar/stellar';
import { log } from '../../logger/logger';
import algosdk from 'algosdk';
import Wallet from 'ethereumjs-wallet';
import { toBuffer } from 'ethereumjs-util';

const ConnectAccountScreen = props => {
  const {
    accountsState: { accounts },
    connectAccount,
    navigation: { goBack },
  } = props;

  const [accountName, setAccountName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [chain, setChain] = useState(null);

  const fioEndpoint = getEndpoint('FIO');

  var importableChains = [
    { name: 'Algorand', symbol: 'ALGO' },
    { name: 'Stellar', symbol: 'XRP' },
    { name: 'Ethereum', symbol: 'ETH' },
    { name: 'Binance', symbol: 'BNB' },
    { name: 'Polygon', symbol: 'MATIC' },
  ];

  supportedChains.map(function (item) {
    importableChains.push(item);
  });

  const connectFioAccount = fioAddresses => {
    if (fioAddresses) {
      fioAddresses.map(function (item) {
        let address = item.fio_address;
        connectAccount({
          address: address,
          privateKey: privateKey,
          chainName: 'FIO',
        });
      });
    }
  };

  const _handleFIOConnect = async () => {
    if (!chain || !privateKey) {
      Alert.alert('Please fill in all required fields');
      return;
    }

    if (!Ecc.isValidPrivate(privateKey)) {
      Alert.alert('Please input valid private key');
      return;
    }

    const fioPublicKey = Ecc.privateToPublic(privateKey);
    fetch(fioEndpoint + '/v1/chain/get_fio_names', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_public_key: fioPublicKey,
      }),
    })
      .then(response => response.json())
      .then(json => connectFioAccount(json.fio_addresses))
      .catch(error =>
        log({
          description:
            '_handleConnect - fetch http://fio.greymass.com/v1/chain/get_fio_names',
          cause: error,
          location: 'ConnectAccountScreen',
        }),
      );

    goBack();
  };

  const _handleEOSIOConnect = async () => {
    if (!chain || !privateKey || !accountName) {
      Alert.alert('Please fill in all required fields');
      return;
    }

    try {
      await getAccount(accountName, chain);
    } catch (e) {
      Alert.alert('Please input valid account name');
      return;
    }

    if (!ecc.isValidPrivate(privateKey)) {
      Alert.alert('Please input valid private key');
      return;
    }

    connectAccount({ accountName, privateKey, chainName: chain.name });
    goBack();
  };

  const _handleAlgorandConnect = async () => {
    if (!chain || !mnemonic) {
      Alert.alert('Please fill in all required fields');
      return;
    }
    try {
      var secretKey = algosdk.mnemonicToSecretKey(mnemonic);
      var address = secretKey.addr;
      if (algosdk.isValidAddress(address)) {
        var accountName =
          address.substring(0, 4) +
          '..' +
          address.substring(address.length - 4, address.length);
        var algoAccount = {
          accountName,
          mnemonic,
          chainName: 'ALGO',
          account: secretKey,
        };
        connectAccount(algoAccount);
      } else {
        Alert.alert('Invalid Algorand address ' + address);
        return;
      }
    } catch (error) {
      Alert.alert('Error: ' + error);
      return;
    }
    goBack();
  };

  const _handleStellarConnect = async () => {
    if (!chain || !privateKey) {
      Alert.alert('Please fill in all required fields');
      return;
    }
    try {
      const processStellarAccount = (json) => {
        var stellarAccount = {
          address: publicKey,
          privateKey: privateKey,
          chainName: 'XLM'
        };
        // If valid account with balances:
        if (json['balances']) {
          connectAccount(stellarAccount);
        } else if (json["status"] && json["status"] === 404) {
          connectAccount(stellarAccount);
          Alert.alert('Account imported but not initialized on chain!');
          return;
        } else if (json["title"]) {
          Alert.alert('Import error: ' + json["title"]);
          return;
        } else {
          Alert.alert('Import error: ' + json);
          return;
        }
      };
      const keyPair = getKeyPair(privateKey);
      const publicKey = keyPair.publicKey();
      loadAccount(publicKey, processStellarAccount)
    } catch (error) {
      Alert.alert('Error: ' + error);
      return;
    }
    goBack();
  };

  const _handleEthereumConnect = async (name) => {
    if (!chain || !privateKey) {
      Alert.alert('Please fill in all required fields');
      return;
    }
    try {
      var zxPrivateKey = (privateKey.startsWith('0x')) ? privateKey : '0x' + privateKey;
      const privateKeyBuffer = toBuffer(zxPrivateKey);
      const wallet = Wallet.fromPrivateKey(privateKeyBuffer);
      const publicKey = wallet.getPublicKeyString();
      const address = wallet.getAddressString();

      const index = accounts.findIndex((cell) => cell.address === address && cell.chainName === name);

      if (index >= 0) {
        Alert.alert(`The account you're are trying to import is a duplicate`);
      }
      else {
        connectAccount({
          address: address,
          publicKey: publicKey,
          privateKey: privateKey,
          chainName: name,
        });
      }
    } catch (error) {
      Alert.alert(error);
      return;
    }
    goBack();
  };

  if (chain && chain.name === 'Algorand') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <View style={styles.content}>
            <KHeader
              title={'Account'}
              subTitle={'Connect your account'}
              style={styles.header}
            />
            <KSelect
              label={'Blockchain'}
              items={importableChains.map(item => ({
                label: item.name,
                value: item,
              }))}
              onValueChange={setChain}
              containerStyle={styles.inputContainer}
            />
            <KInput
              label={'Mnemonic'}
              placeholder={'Enter your Algorand mnemonic phrase'}
              value={mnemonic}
              multiline={true}
              onChangeText={setMnemonic}
              onPasteHandler={setMnemonic}
              containerStyle={styles.inputContainer}
            />
            <View style={styles.spacer} />
            <KButton
              title={'Connect account'}
              theme={'blue'}
              style={styles.button}
              renderIcon={() => (
                <Image
                  source={require('../../../assets/icons/accounts.png')}
                  style={styles.buttonIcon}
                />
              )}
              onPress={_handleAlgorandConnect}
            />
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <MaterialIcon
                name={'keyboard-backspace'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  } else if (chain && chain.name === 'Stellar') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <View style={styles.content}>
            <KHeader
              title={'Account'}
              subTitle={'Connect your account'}
              style={styles.header}
            />
            <KSelect
              label={'Blockchain'}
              items={importableChains.map(item => ({
                label: item.name,
                value: item,
              }))}
              onValueChange={setChain}
              containerStyle={styles.inputContainer}
            />
            <KInput
              label={'Private Key'}
              placeholder={'Enter your Stellar private key'}
              secureTextEntry
              value={privateKey}
              onChangeText={setPrivateKey}
              onPasteHandler={setPrivateKey}
              containerStyle={styles.inputContainer}
            />
            <View style={styles.spacer} />
            <KButton
              title={'Connect account'}
              theme={'blue'}
              style={styles.button}
              renderIcon={() => (
                <Image
                  source={require('../../../assets/icons/accounts.png')}
                  style={styles.buttonIcon}
                />
              )}
              onPress={_handleStellarConnect}
            />
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <MaterialIcon
                name={'keyboard-backspace'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  } else if (chain && (chain.name === 'Ethereum' || chain.name === 'Binance' || chain.name === 'Polygon')) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <View style={styles.content}>
            <KHeader
              title={'Account'}
              subTitle={'Connect your account'}
              style={styles.header}
            />
            <KSelect
              label={'Blockchain'}
              items={importableChains.map(item => ({
                label: item.name,
                value: item,
              }))}
              onValueChange={setChain}
              containerStyle={styles.inputContainer}
            />
            <KInput
              label={'Private Key'}
              placeholder={`Enter your ${chain.name} private key`}
              secureTextEntry
              value={privateKey}
              onChangeText={setPrivateKey}
              onPasteHandler={setPrivateKey}
              containerStyle={styles.inputContainer}
            />
            <View style={styles.spacer} />
            <KButton
              title={'Connect account'}
              theme={'blue'}
              style={styles.button}
              renderIcon={() => (
                <Image
                  source={require('../../../assets/icons/accounts.png')}
                  style={styles.buttonIcon}
                />
              )}
              onPress={() => _handleEthereumConnect(chain.symbol)}
            />
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <MaterialIcon
                name={'keyboard-backspace'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  } else if (chain && chain.name === 'FIO') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <View style={styles.content}>
            <KHeader
              title={'Account'}
              subTitle={'Connect your account'}
              style={styles.header}
            />
            <KSelect
              label={'Blockchain'}
              items={importableChains.map(item => ({
                label: item.name,
                value: item,
              }))}
              onValueChange={setChain}
              containerStyle={styles.inputContainer}
            />
            <KInput
              label={'Private Key'}
              placeholder={'Enter your FIO private key'}
              secureTextEntry
              value={privateKey}
              onChangeText={setPrivateKey}
              onPasteHandler={setPrivateKey}
              containerStyle={styles.inputContainer}
            />
            <View style={styles.spacer} />
            <KButton
              title={'Connect account'}
              theme={'blue'}
              style={styles.button}
              renderIcon={() => (
                <Image
                  source={require('../../../assets/icons/accounts.png')}
                  style={styles.buttonIcon}
                />
              )}
              onPress={_handleFIOConnect}
            />
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <MaterialIcon
                name={'keyboard-backspace'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <View style={styles.content}>
            <KHeader
              title={'Account'}
              subTitle={'Connect your account'}
              style={styles.header}
            />
            <KSelect
              label={'Blockchain'}
              items={importableChains.map(item => ({
                label: item.name,
                value: item,
              }))}
              onValueChange={setChain}
              containerStyle={styles.inputContainer}
            />
            <KInput
              label={'Account name'}
              placeholder={'Enter your account name'}
              value={accountName}
              onChangeText={setAccountName}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
            />
            <KInput
              label={'Private Key'}
              placeholder={'Enter your private key'}
              secureTextEntry
              value={privateKey}
              onChangeText={setPrivateKey}
              onPasteHandler={setPrivateKey}
              containerStyle={styles.inputContainer}
            />
            <View style={styles.spacer} />
            <KButton
              title={'Connect account'}
              theme={'blue'}
              style={styles.button}
              renderIcon={() => (
                <Image
                  source={require('../../../assets/icons/accounts.png')}
                  style={styles.buttonIcon}
                />
              )}
              onPress={_handleEOSIOConnect}
            />
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <MaterialIcon
                name={'keyboard-backspace'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }
};

export default connectAccounts()(ConnectAccountScreen);
