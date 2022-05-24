import React, { useState } from 'react';
import { SafeAreaView, TouchableOpacity, View, Alert } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './FIORequestSend.style';
import { KHeader, KButton, KInput, KSelect, KText } from '../../components';
import { connectAccounts } from '../../redux';
import { getAccount, transfer } from '../../eos/eos';
import { sendFioTransfer } from '../../eos/fio';
import { submitAlgoTransaction } from '../../algo/algo';
import { submitStellarPayment } from '../../stellar/stellar';
import { getChain, getEndpoint } from '../../eos/chains';
import { PRIMARY_BLUE } from '../../theme/colors';
import { log } from '../../logger/logger';

const FIOSendDirectScreen = props => {
  const [chainName, setChainName] = useState();
  const [amount, setAmount] = useState(0);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    navigation: { navigate, goBack },
    accountsState: { accounts, addresses, keys, totals, history, config },
    route: {
      params: { fromFioAccount, toFioAddress },
    },
  } = props;

  const fioEndpoint = getEndpoint('FIO');

  var importedChains = [];
  accounts.map((chain, index, self) => {
    if (importedChains.indexOf(chain.chainName) < 0) {
      importedChains.push(chain.chainName);
    }
  });

  const _callback = txid => {
    Alert.alert('Transfer completed: ' + txid);
    goBack();
  };

  const doEOSIOTransfer = async (toAccountPubkey, fromAccountPubkey) => {
    const chain = getChain(chainName);
    if (!chain) {
      Alert.alert('Unknown EOSIO chain ' + chainName);
      setLoading(false);
      return;
    }
    // To EOSIO Account record:
    if (!toAccountPubkey) {
      Alert.alert('Empty to account pubkey');
      setLoading(false);
      return;
    }
    const [toActor] = toAccountPubkey.split(',');
    const toAccountInfo = await getAccount(toActor, chain);
    if (!toAccountInfo) {
      Alert.alert(
        'Error fetching account data for ' + toActor + ' on chain ' + chainName,
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
          chainName,
      );
      return;
    }
    // Find matching active account:
    const activeAccounts = accounts.filter((value, index, array) => {
      return value.accountName === fromActor && value.chainName === chainName;
    });
    if (activeAccounts.length === 0) {
      Alert.alert(
        'Could not find matching account to send transfer from in this wallet',
      );
      setLoading(false);
      return;
    }
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
      const res = await transfer(
        toActor,
        floatAmount,
        memo,
        fromFioAccount,
        chain,
      );
      if (res && res.transaction_id) {
        Alert.alert('Transfer completed in tx ' + res.transaction_id);
      } else {
        let fromAccountName = fromFioAccount.address
          ? fromFioAccount.address
          : fromFioAccount.accountName;
        let error = {
          description: 'Failed doEOSIOTransfer',
          method: 'transfer',
          location: 'FIOSendDirectScreen',
          cause: res,
          fromAccount: fromAccountName,
          toAccount: toActor,
          amount: floatAmount,
          chain: chain,
        };
        log(error);
        Alert.alert('FIO Send: transfer failed.');
      }
      setLoading(false);
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
    // Check amount
    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Invalid transfer amount ' + floatAmount);
      setLoading(false);
      return;
    }
    submitAlgoTransaction(
      fromFioAccount,
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
        fromFioAccount,
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
  ) => {
    if (!fromAccountPubkey) {
      Alert.alert(
        'No valid ' +
          chainName +
          ' public address found for ' +
          fromFioAccount.address,
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
      if (chainName === 'ALGO') {
        await doAlgoTransfer(toAccountPubkey, fromAccountPubkey);
      } else if (chainName === 'FIO') {
        await doFIOTransfer(toAccountPubkey, fromAccountPubkey);
      } else if(chainCode === 'XLM') {
        await doStellarTransfer(toAccountPubkey, fromAccountPubkey);
      } else if(chainCode === 'ETH' || chainCode === 'BNB' || chainCode === 'MATIC' || chainCode === 'AURORA') { //TODO
        await doEthereumTransfer(toAccountPubkey, fromAccountPubkey);
      } else {
        // Any of EOSIO based chains:
        await doEOSIOTransfer(toAccountPubkey, fromAccountPubkey);
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
      Alert.alert(e.message);
    }
  };

  const handleToAccountAddress = async toAccountPubkey => {
    let chainCode = chainName === 'Telos' ? 'TLOS' : chainName;
    if (!toAccountPubkey) {
      Alert.alert(
        'No ' + chainCode + ' public address found for ' + validToAccount,
      );
      setLoading(false);
      return;
    }
    try {
      fetch(fioEndpoint + '/v1/chain/get_pub_address', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fio_address: fromFioAccount.address,
          chain_code: chainCode,
          token_code: chainCode,
        }),
      })
        .then(response => response.json())
        .then(json =>
          handleFromToAccountTransfer(toAccountPubkey, json.public_address),
        )
        .catch(error =>
          Alert.alert('Error fetching payer public address for ' + chainCode),
        );
    } catch (err) {
      Alert.alert('Error: ' + err);
      log({
        description: '_handleSubmit',
        cause: err,
        location: 'FIOSendScreen',
      });
      return;
    }
  };

  const _handleSubmit = async () => {
    if (!fromFioAccount || !toFioAddress || !chainName || !amount) {
      Alert.alert(
        'Please fill all required fields including valid payee address!',
      );
      return;
    }
    let chainCode = chainName === 'Telos' ? 'TLOS' : chainName;
    setLoading(true);
    // Load toAccount actor,publicKey:
    fetch(fioEndpoint + '/v1/chain/get_pub_address', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_address: toFioAddress.address,
        chain_code: chainCode,
        token_code: chainCode,
      }),
    })
      .then(response => response.json())
      .then(json => handleToAccountAddress(json.public_address))
      .catch(error =>
        Alert.alert('Error fetching payee public address for ' + chainCode),
      );
  };

  const _handleFIORequest = () => {
    navigate('FIORequestDirect', { fromFioAccount, toFioAddress });
  };

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
          <KText>From address: {fromFioAccount.address}</KText>
          <KText>To address: {toFioAddress.address}</KText>
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
          <KButton
            title={'FIO Request'}
            theme={'brown'}
            style={styles.button}
            icon={'check'}
            isLoading={loading}
            onPress={_handleFIORequest}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default connectAccounts()(FIOSendDirectScreen);
