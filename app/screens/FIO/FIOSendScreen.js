import React, { useState } from 'react';
import { SafeAreaView, TouchableOpacity, View, Alert } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Fio } from '@fioprotocol/fiojs';
import styles from './FIORequestSend.style';
import { KHeader, KButton, KInput, KSelect, KText } from '../../components';
import { connectAccounts } from '../../redux';
import { getAccount, transfer } from '../../eos/eos';
import { sendFioTransfer } from '../../eos/fio';
import { submitAlgoTransaction } from '../../algo/algo';
import { submitStellarPayment } from '../../stellar/stellar';
import { getChain, getEndpoint } from '../../eos/chains';
import { getTokens, getTokenByName, transferToken } from '../../eos/tokens';
import { PRIMARY_BLUE } from '../../theme/colors';
import { log } from '../../logger/logger';

const FIOSendScreen = props => {
  const [fromAccount, setFromAccount] = useState();
  const [toAccount, setToAccount] = useState();
  const [validToAccount, setValidToAccount] = useState();
  const [addressInvalidMessage, setAddressInvalidMessage] = useState();
  const [chainName, setChainName] = useState();
  const [amount, setAmount] = useState(0);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    addAddress,
    navigation: { goBack },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const fioEndpoint = getEndpoint('FIO');

  const fioAccounts = accounts.filter((value, index, array) => {
    return value.chainName === 'FIO';
  });

  var tokenChainMap = [];
  var importedChains = [];
  accounts.map((chain, index, self) => {
    if (importedChains.indexOf(chain.chainName) < 0) {
      importedChains.push(chain.chainName);
      let chainName = chain.chainName === 'Telos' ? 'TLOS' : chain.chainName;
      var token = getTokens(chainName);
      if (token && token.name) {
        importedChains.push(token.name);
        tokenChainMap[token.name] = chainName;
      }
    }
  });

  const _handleFromAccountChange = value => {
    setFromAccount(value);
  };

  const _validateAddress = async address => {
    if (fioAccounts.length == 1 && !fromAccount) {
      _handleFromAccountChange(fioAccounts[0]);
    }
    if (
      address.length >= 3 &&
      address.indexOf('@') > 0 &&
      address.indexOf('@') < address.length - 1
    ) {
      fetch(fioEndpoint + '/v1/chain/avail_check', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fio_name: address,
        }),
      })
        .then(response => response.json())
        .then(json => updateAvailableState(json.is_registered, address))
        .catch(error => updateAvailableState(-1, address, error));
    }
  };

  const addFIOAddressToAddressbook = (fioPubKey, fioAddress) => {
    let accountHash = Fio.accountHash(fioPubKey);
    let name = fioAddress.split('@')[0];
    let addressJson = {
      name: name,
      address: fioAddress,
      actor: accountHash,
      publicKey: fioPubKey,
    };
    let matchingAddresses = addresses.filter(
      (item, index) => item.address === fioAddress,
    );
    if (matchingAddresses.length === 0) {
      addAddress(addressJson);
    }
  };

  const loadFIOPubkeyAndRegisterFIOAddress = async address => {
    fetch(fioEndpoint + '/v1/chain/get_pub_address', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_address: address,
        chain_code: 'FIO',
        token_code: 'FIO',
      }),
    })
      .then(response => response.json())
      .then(json => addFIOAddressToAddressbook(json.public_address, address))
      .catch(error =>
        log({
          description:
            'loadFIOPubkeyAndRegisterFIOAddress - fetch ' +
            fioEndpoint +
            '/v1/chain/get_pub_address',
          cause: error,
          location: 'FIOSendScreen',
        }),
      );
  };

  const updateAvailableState = (regcount, address, error) => {
    if (regcount === 0) {
      setAddressInvalidMessage('Invalid address!');
    } else if (regcount === 1) {
      setAddressInvalidMessage('');
      setValidToAccount(address);
      loadFIOPubkeyAndRegisterFIOAddress(address);
    } else if (error) {
      setAddressInvalidMessage('Error validating address');
    }
  };

  const _callback = txid => {
    Alert.alert('Transfer completed: ' + txid);
    goBack();
  };

  const doEOSIOTransfer = async (
    toAccountPubkey,
    fromAccountPubkey,
    chainCode,
    tokenName,
  ) => {
    const chain = getChain(chainCode);
    if (!chain) {
      Alert.alert('Unknown EOSIO chain ' + chainCode);
      setLoading(false);
      return;
    }
    // To EOSIO Account record:
    if (!toAccountPubkey) {
      Alert.alert('Empty to account pubkey');
      setLoading(false);
      return;
    }
    const [toActor, toPubkey] = toAccountPubkey.split(',');
    const toAccountInfo = await getAccount(toActor, chain);
    if (!toAccountInfo) {
      Alert.alert(
        'Error fetching account data for ' + toActor + ' on chain ' + chainCode,
      );
      return;
    }
    // From EOSIO Account record:
    if (!fromAccountPubkey) {
      Alert.alert('Empty fromPubkey account pubkey');
      setLoading(false);
      return;
    }
    const [fromActor] = fromAccountPubkey.split(',');
    const fromAccountInfo = await getAccount(fromActor, chain);
    if (!fromAccountInfo) {
      Alert.alert(
        'Error fetching account data for ' +
          fromActor +
          ' on chain ' +
          chainCode,
      );
      return;
    }
    // Find matching active account:
    const activeAccounts = accounts.filter((value, index, array) => {
      let chainName = chainCode === 'TLOS' ? 'Telos' : chainCode;
      return value.accountName === fromActor && value.chainName === chainName;
    });
    if (activeAccounts.length === 0) {
      Alert.alert(
        'Could not find matching account to send transfer from in this wallet',
      );
      setLoading(false);
      return;
    }
    const fromAccount = activeAccounts[0];
    // Check amount
    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Invalid transfer amount ' + floatAmount);
      setLoading(false);
      return;
    }
    // Now do transfer
    try {
      setLoading(true);
      if (chainCode === tokenName) {
        const res = await transfer(
          toActor,
          floatAmount,
          memo,
          fromAccount,
          chain,
        );
        if (res && res.transaction_id) {
          Alert.alert('Transfer completed in tx ' + res.transaction_id);
        } else {
          let error = {
            description: 'Failed doEOSIOTransfer',
            method: 'transfer',
            location: 'FIOSendScreen',
            cause: res,
            fromAccount: fromAccount.accountName,
            toAccount: toActor,
            amount: floatAmount,
            chain: chain,
          };
          log(error);
          Alert.alert('FIO Send: transfer failed.');
        }
      } else {
        // Token transfer on chain:
        let token = getTokenByName(tokenName);
        const res = await transferToken(
          toActor,
          floatAmount,
          memo,
          fromAccount,
          token,
        );
        if (res && res.transaction_id) {
          Alert.alert(
            'Completed transfer of ' +
              floatAmount +
              ' ' +
              tokenName +
              ' in tx ' +
              res.transaction_id,
          );
        } else {
          let error = {
            description: 'Failed doEOSIOTransfer',
            method: 'transferToken',
            location: 'FIOSendScreen',
            cause: res,
            fromAccount: fromAccount.accountName,
            toAccount: toActor,
            amount: floatAmount,
            token: token,
          };
          log(error);
          Alert.alert('FIO Send: token transfer failed.');
        }
      }
      setLoading(false);
      goBack();
    } catch (err) {
      Alert.alert('Transfer failed: ' + err);
      log({
        description: 'doEOSIOTransfer',
        cause: err,
        location: 'FIOSendScreen',
      });
      setLoading(false);
    }
  };

  const doEthereumTransfer = async (toAccountPubkey, fromAccountPubkey) => {
    Alert.alert("Not supported! Use regular transfer.");
  };

  const doStellarTransfer = async (toAccountPubkey, fromAccountPubkey) => {
    // Find imported matching from account:
    const activeAccounts = accounts.filter((value, index, array) => {
      return (
        value.chainName === 'XLM' && value.address === fromAccountPubkey
      );
    });
    if (activeAccounts.length === 0) {
      Alert.alert(
        'Could not find imported Stellar account to pubkey ' + fromAccountPubkey,
      );
      setLoading(false);
      return;
    }
    const fromAccount = activeAccounts[0];
    // Check amount
    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Invalid transfer amount ' + floatAmount);
      setLoading(false);
      return;
    }
    await submitStellarPayment(
      fromAccount,
      toAccountPubkey,
      floatAmount,
      memo,
      _callback,
    );
  };

  const doAlgoTransfer = async (toAccountPubkey, fromAccountPubkey) => {
    // Find imported matching from account:
    const activeAccounts = accounts.filter((value, index, array) => {
      return (
        value.chainName === 'ALGO' && value.account.addr === fromAccountPubkey
      );
    });
    if (activeAccounts.length === 0) {
      Alert.alert(
        'Could not find imported Algo account to pubkey ' + fromAccountPubkey,
      );
      setLoading(false);
      return;
    }
    const fromAccount = activeAccounts[0];
    // Check amount
    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Invalid transfer amount ' + floatAmount);
      setLoading(false);
      return;
    }
    submitAlgoTransaction(
      fromAccount,
      toAccountPubkey,
      floatAmount,
      memo,
      _callback,
    );
  };

  const doFIOTransfer = async (toAccountPubkey, fromAccountPubkey) => {
    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Invalid transfer amount ' + floatAmount);
      setLoading(false);
      return;
    }
    try {
      await sendFioTransfer(
        fromAccount,
        toAccountPubkey,
        floatAmount,
        memo,
        _callback,
      );
    } catch (err) {
      Alert.alert('Transfer failed: ' + err);
      log({
        description: 'doFIOTransfer',
        cause: err,
        location: 'FIOSendScreen',
      });
    }
  };

  const handleFromToAccountTransfer = async (
    toAccountPubkey,
    fromAccountPubkey,
    chainCode,
    tokenName,
  ) => {
    if (!fromAccountPubkey) {
      Alert.alert(
        'No valid ' +
          chainCode +
          ' public address found for ' +
          fromAccount.address,
      );
      setLoading(false);
      return;
    }
    if (!toAccountPubkey) {
      Alert.alert(
        'No ' + chainCode + ' public address found for ' + validToAccount,
      );
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      if (chainCode === 'ALGO') {
        await doAlgoTransfer(toAccountPubkey, fromAccountPubkey);
      } else if (chainCode === 'FIO') {
        await doFIOTransfer(toAccountPubkey, fromAccountPubkey);
      } else if(chainCode === 'XLM') {
        await doStellarTransfer(toAccountPubkey, fromAccountPubkey);
      } else if(chainCode === 'ETH' || chainCode === 'BNB' || chainCode === 'MATIC' || chainCode === 'AURORA') { //TODO
        await doEthereumTransfer(toAccountPubkey, fromAccountPubkey);
      } else {
        // Any of EOSIO based transfer:
        await doEOSIOTransfer(
          toAccountPubkey,
          fromAccountPubkey,
          chainCode,
          tokenName,
        );
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
      Alert.alert(e.message);
    }
  };

  const handleToAccountAddress = async (
    toAccountPubkey,
    chainCode,
    tokenName,
  ) => {
    if (!toAccountPubkey) {
      Alert.alert(
        'No ' + chainCode + ' public address found for ' + validToAccount,
      );
      setLoading(false);
      return;
    }
    if (tokenName === 'Telos') {
      tokenName = 'TLOS';
    }
    try {
      fetch(fioEndpoint + '/v1/chain/get_pub_address', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fio_address: fromAccount.address,
          chain_code: chainCode,
          token_code: chainCode,
        }),
      })
        .then(response => response.json())
        .then(json =>
          handleFromToAccountTransfer(
            toAccountPubkey,
            json.public_address,
            chainCode,
            tokenName,
          ),
        )
        .catch(error =>
          Alert.alert('Error fetching payer public address for ' + chainCode),
        );
    } catch (err) {
      Alert.alert('Error: ' + err);
      log({
        description: 'handleToAccountAddress',
        cause: err,
        location: 'FIOSendScreen',
      });
      return;
    }
  };

  const _handleSubmit = async () => {
    if (!fromAccount || !validToAccount || !chainName || !amount) {
      Alert.alert(
        'Please fill all required fields including valid payee address!',
      );
      return;
    }
    let chainCode = chainName === 'Telos' ? 'TLOS' : chainName;
    if (tokenChainMap[chainName]) {
      chainCode = tokenChainMap[chainName];
    }
    setLoading(true);
    // Load toAccount actor,publicKey:
    fetch(fioEndpoint + '/v1/chain/get_pub_address', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_address: validToAccount,
        chain_code: chainCode,
        token_code: chainCode,
      }),
    })
      .then(response => response.json())
      .then(json =>
        handleToAccountAddress(json.public_address, chainCode, chainName),
      )
      .catch(error =>
        Alert.alert('Error fetching payee public address for ' + chainCode),
      );
  };

  if (fioAccounts.length === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <View style={styles.inner}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <MaterialIcon
                name={'keyboard-backspace'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
            <KHeader
              title={'FIO Send payment'}
              subTitle={'Send payment to another FIO address'}
              style={styles.header}
            />
            <KText>From FIO address: {fioAccounts[0].address}</KText>
            <KInput
              label={'To address'}
              placeholder={'Enter FIO address'}
              value={toAccount}
              onChangeText={_validateAddress}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
            />
            <KText style={styles.errorMessage}>{addressInvalidMessage}</KText>
            <KSelect
              label={'Coin/token to send'}
              items={importedChains.map(name => ({
                label: `${name}`,
                value: `${name}`,
              }))}
              onValueChange={setChainName}
              containerStyle={styles.inputContainer}
            />
            <KInput
              label={'Amount to send'}
              placeholder={'Enter requested amount'}
              value={amount}
              onChangeText={setAmount}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
              keyboardType={'numeric'}
            />
            <KInput
              label={'Memo'}
              placeholder={'Enter memo'}
              value={memo}
              multiline={true}
              onChangeText={setMemo}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
            />
            <KButton
              title={'Submit'}
              theme={'blue'}
              style={styles.button}
              icon={'check'}
              isLoading={loading}
              onPress={_handleSubmit}
            />
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
          <View style={styles.inner}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <MaterialIcon
                name={'keyboard-backspace'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
            <KHeader
              title={'FIO Send payment'}
              subTitle={'Send payment to another FIO address'}
              style={styles.header}
            />
            <KSelect
              label={'From address'}
              items={fioAccounts.map(item => ({
                label: `${item.chainName}: ${item.address}`,
                value: item,
              }))}
              onValueChange={_handleFromAccountChange}
              containerStyle={styles.inputContainer}
            />
            <KInput
              label={'To address'}
              placeholder={'Enter FIO address'}
              value={toAccount}
              onChangeText={_validateAddress}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
            />
            <KText style={styles.errorMessage}>{addressInvalidMessage}</KText>
            <KSelect
              label={'Coin/token to send'}
              items={importedChains.map(name => ({
                label: `${name}`,
                value: `${name}`,
              }))}
              onValueChange={setChainName}
              containerStyle={styles.inputContainer}
            />
            <KInput
              label={'Amount to send'}
              placeholder={'Enter requested amount'}
              value={amount}
              onChangeText={setAmount}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
              keyboardType={'numeric'}
            />
            <KInput
              label={'Memo'}
              placeholder={'Enter memo'}
              value={memo}
              multiline={true}
              onChangeText={setMemo}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
            />
            <KButton
              title={'Submit'}
              theme={'blue'}
              style={styles.button}
              icon={'check'}
              isLoading={loading}
              onPress={_handleSubmit}
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }
};

export default connectAccounts()(FIOSendScreen);
