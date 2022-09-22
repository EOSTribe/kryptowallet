import React, { useState } from 'react';
import { Fio } from '@fioprotocol/fiojs';
import {
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Clipboard,
  View,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import styles from './FIORequestSend.style';
import { KHeader, KButton, KText, KInput } from '../../components';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { TextEncoder, TextDecoder } from 'text-encoding';
import { getAccount, transfer } from '../../eos/eos';
import { sendFioTransfer } from '../../eos/fio';
import { submitAlgoTransaction } from '../../algo/algo';
import { submitStellarPayment } from '../../stellar/stellar';
import { getChain, getEndpoint } from '../../eos/chains';
import { getTokens, getTokenByName, transferToken } from '../../eos/tokens';
import { rejectFundsRequest, recordObtData } from '../../eos/fio';
import { log } from '../../logger/logger';

const ViewFIORequestScreen = props => {
  const [transactionId, setTransactionId] = useState('');
  const [memo, setMemo] = useState('');
  const [fee, setFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const {
    addAddress,
    navigation: { navigate, goBack },
    route: {
      params: { fioAccount, fioRequest, title },
    },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const fioEndpoint = getEndpoint('FIO');

  var otherPublicKey = fioRequest.payer_fio_public_key;
  if (fioAccount.address === fioRequest.payer_fio_address) {
    otherPublicKey = fioRequest.payee_fio_public_key;
  }
  const cipher = Fio.createSharedCipher({
    privateKey: fioAccount.privateKey,
    publicKey: otherPublicKey,
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
  });

  var tokenChainMap = [];
  accounts.map((chain, index, self) => {
    let chainName = chain.chainName === 'Telos' ? 'TLOS' : chain.chainName;
    let token = getTokens(chainName);
    if (token) {
      tokenChainMap[token.name] = chainName;
    }
  });

  let decryptedContent = null;
  try {
    decryptedContent = cipher.decrypt('new_funds_content', fioRequest.content);
    //console.log(decryptedContent);
  } catch (err) {
    Alert.alert('Error decrypting FIO Request: ' + err);
    log({
      description: 'Error decrypting FIO Request',
      cause: err,
      location: 'ViewFIORequestScreen',
    });
  }

  const _copyMemoToClipboard = () => {
    if(decryptedContent != null) {
      Clipboard.setString(decryptedContent.memo);
      Alert.alert('Memo copied to Clipboard');
    }
  };

  const getRequestTitle = () => {
    return fioRequest.payer_fio_address + ' -> ' + fioRequest.payee_fio_address;
  };

  const getFee = async address => {
    fetch(fioEndpoint + '/v1/chain/get_fee', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        end_point: 'add_pub_address',
        fio_address: address,
      }),
    })
      .then(response => response.json())
      .then(json => setFee(json.fee))
      .catch(error =>
        log({
          description: 'getFee - fetch ' + fioEndpoint + '/v1/chain/get_fee',
          cause: error,
          location: 'ViewFIORequestScreen',
        }),
      );
  };

  let chain = null;
  if (decryptedContent != null) {
    var chainCode = decryptedContent.chain_code.toUpperCase().trim();
    chain = getChain(chainCode);
    if (!chain && chainCode === 'ALGO') {
      chain = { name: 'ALGO', symbol: 'ALGO' };
    } else if (!chain && chainCode === 'XLM') {
      chain = { name: 'XLM', symbol: 'XLM' };
    } else if (tokenChainMap[chainCode]) {
      let chainName = tokenChainMap[chainCode];
      chain = getChain(chainName);
    }
  }

  var chainAccounts = [];
  if (chain) {
    chainAccounts = accounts.filter((value, index, array) => {
      return value.chainName !== chain.name;
    });
  }

  const getFioPubkey = async address => {
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
            'getFioPubkey - fetch ' + fioEndpoint + '/v1/chain/get_pub_address',
          cause: error,
          location: 'ViewFIORequestScreen',
        }),
      );
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

  var payerRole = false;
  if (fioAccount.address === fioRequest.payer_fio_address) {
    payerRole = true;
    getFee(fioAccount.address);
    getFioPubkey(fioRequest.payee_fio_address);
  } else {
    getFioPubkey(fioRequest.payer_fio_address);
  }

  const markFIORequestCompleted = async transferId => {
    try {
      var chainCode = decryptedContent.chain_code.toUpperCase();
      await recordObtData(
        fioAccount,
        fioRequest.payee_fio_address,
        fioRequest.payee_fio_public_key,
        chainCode,
        decryptedContent.amount,
        fioRequest.fio_request_id,
        transferId,
        decryptedContent.memo,
        fee,
      );
      Alert.alert('FIO Request processed!');
      navigate('Accounts');
    } catch (err) {
      Alert.alert(err.message);
      log({
        description: 'markFIORequestCompleted',
        cause: err,
        location: 'ViewFIORequestScreen',
      });
    }
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
    const [toActor] = toAccountPubkey.split(',');
    const toAccountInfo = await getAccount(toActor, chain);
    if (!toAccountInfo) {
      Alert.alert(
        'Error fetching account data for ' + toActor + ' on chain ' + chainCode,
      );
      return;
    }
    // From EOSIO Account record:
    const [fromActor] = fromAccountPubkey.split(',');
    // Load account info:
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
    const activeAccounts = accounts.filter((value, index, array) => {
      let chainName = chainCode === 'TLOS' ? 'Telos' : chainCode;
      return value.accountName === fromActor && value.chainName === chainName;
    });
    if (activeAccounts.length === 0) {
      Alert.alert(
        'Could not find matching account to send transfer from in this wallet',
      );
      return;
    }
    const fromAccount = activeAccounts[0];
    // Check amount
    const floatAmount = parseFloat(decryptedContent.amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Invalid transfer amount ' + decryptedContent.amount);
      return;
    }
    try {
      setLoading(true);
      if (chainCode === tokenName) {
        const res = await transfer(
          toAccountName,
          floatAmount,
          decryptedContent.memo,
          fromAccount,
          chain,
        );
        if (res && res.transaction_id) {
          markFIORequestCompleted(res.transaction_id);
        } else {
          let error = {
            description: 'Failed doEOSIOTransfer',
            method: 'transfer',
            location: 'ViewFIORequestScreen',
            cause: res,
            fromAccount: fromAccount.accountName,
            toAccount: toAccountName,
            amount: floatAmount,
            chain: chain,
          };
          log(error);
          Alert.alert('Transfer failed.');
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
          markFIORequestCompleted(res.transaction_id);
        } else {
          let error = {
            description: 'Failed doEOSIOTransfer',
            method: 'transferToken',
            location: 'ViewFIORequestScreen',
            cause: res,
            fromAccount: fromAccount.accountName,
            toAccount: toActor,
            amount: floatAmount,
            token: token,
          };
          log(error);
          Alert.alert('Token transfer failed.');
        }
      }
      setLoading(false);
    } catch (err) {
      Alert.alert('Transfer failed: ' + err);
      log({
        description: 'doEOSIOTransfer',
        cause: err,
        location: 'ViewFIORequestScreen',
      });
      setLoading(false);
    }
    return;
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
      return;
    }
    const fromAccount = activeAccounts[0];
    // Check amount
    const floatAmount = parseFloat(decryptedContent.amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Invalid transfer amount ' + decryptedContent.amount);
      return;
    }
    setLoading(true);
    try {
      await submitAlgoTransaction(
        fromAccount,
        toAccountPubkey,
        floatAmount,
        decryptedContent.memo,
        markFIORequestCompleted,
      );
    } catch (err) {
      setLoading(false);
      Alert.alert(err.message);
      log({
        description: 'doAlgoTransfer',
        cause: err.message,
        location: 'ViewFIORequestScreen',
      });
    } finally {
      setLoading(false);
    }
    return;
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
      return;
    }
    const fromAccount = activeAccounts[0];
    // Check amount
    const floatAmount = parseFloat(decryptedContent.amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Invalid transfer amount ' + decryptedContent.amount);
      return;
    }
    setLoading(true);
    try {
      await submitStellarPayment(
        fromAccount,
        toAccountPubkey,
        floatAmount,
        decryptedContent.memo,
        markFIORequestCompleted,
      );
    } catch (err) {
      setLoading(false);
      Alert.alert(err.message);
      log({
        description: 'doStellarTransfer',
        cause: err.message,
        location: 'ViewFIORequestScreen',
      });
    } finally {
      setLoading(false);
    }
    return;
  };

  const doFIOTransfer = async (toAccountPubkey, fromAccountPubkey) => {
    // Find imported matching from account:
    const activeAccounts = accounts.filter((value, index, array) => {
      const accountHash = Fio.accountHash(fromAccountPubkey);
      return value.chainName === 'FIO' && value.accountName === accountHash;
    });
    if (activeAccounts.length === 0) {
      Alert.alert(
        'Could not find imported FIO account with pubkey ' + fromAccountPubkey,
      );
      return;
    }
    const fromAccount = activeAccounts[0];
    // Check amount
    const floatAmount = parseFloat(decryptedContent.amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Invalid transfer amount ' + floatAmount);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await sendFioTransfer(
        fromAccount,
        toAccountPubkey,
        floatAmount,
        memo,
        markFIORequestCompleted,
      );
    } catch (err) {
      Alert.alert('Transfer failed: ' + err);
      log({
        description: 'doFIOTransfer',
        cause: err,
        location: 'FIOSendScreen',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFromToAccountTransfer = async (
    toActorPubkey,
    fromActorPubkey,
    chainCode,
    tokenName,
  ) => {
    if (!fromActorPubkey) {
      Alert.alert('No valid ' + chainCode + ' public address found');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      if (chainCode === 'ALGO') {
        await doAlgoTransfer(toActorPubkey, fromActorPubkey);
      } else if (chainCode === 'XLM') {
        await doStellarTransfer(toActorPubkey, fromActorPubkey);
      } else if (chainCode === 'FIO') {
        await doFIOTransfer(toActorPubkey, fromActorPubkey);
      } else {
        // Any of EOSIO based chains:
        await doEOSIOTransfer(
          toActorPubkey,
          fromActorPubkey,
          chainCode,
          tokenName,
        );
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Alert.alert(err.message);
      log({
        description: 'handleFromToAccountTransfer',
        cause: err.message,
        location: 'ViewFIORequestScreen',
      });
    }
  };

  const handleToAccountAddress = async (
    toActorPubkey,
    chainCode,
    tokenName,
  ) => {
    if (!toActorPubkey) {
      Alert.alert('No ' + chainCode + ' public address found');
      setLoading(false);
      return;
    }
    if (tokenName === 'Telos') {
      tokenName = 'TLOS';
    }
    try {
      // Now load corresponding from account
      fetch(fioEndpoint + '/v1/chain/get_pub_address', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fio_address: fioAccount.address,
          chain_code: chainCode,
          token_code: chainCode,
        }),
      })
        .then(response => response.json())
        .then(json =>
          handleFromToAccountTransfer(
            toActorPubkey,
            json.public_address,
            chainCode,
            tokenName,
          ),
        )
        .catch(error =>
          Alert.alert('Error fetching payer public address for ' + chainCode),
        );
    } catch (e) {
      Alert.alert('Error: ' + e);
      return;
    }
  };

  const _handleTransferAndAccept = async () => {
    const chainName = decryptedContent.chain_code.toUpperCase();
    const toFioAddress = fioRequest.payee_fio_address;
    let chainCode = chainName === 'Telos' ? 'TLOS' : chainName;
    if (tokenChainMap[chainName]) {
      chainCode = tokenChainMap[chainName];
    }
    setLoading(true);
    fetch(fioEndpoint + '/v1/chain/get_pub_address', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_address: toFioAddress,
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

  const _handleExternalAccept = async () => {
    try {
      const chainCode = decryptedContent.chain_code.toUpperCase();
      await recordObtData(
        fioAccount,
        fioRequest.payee_fio_address,
        fioRequest.payee_fio_public_key,
        chainCode,
        decryptedContent.amount,
        fioRequest.fio_request_id,
        transactionId,
        memo,
        fee,
      );
      Alert.alert('Request processed!');
      navigate('Accounts');
    } catch (err) {
      Alert.alert(err.message);
      log({
        description: '_handleExternalAccept',
        cause: err.message,
        location: 'ViewFIORequestScreen',
      });
    }
  };

  const _handleReject = async () => {
    try {
      await rejectFundsRequest(fioAccount, fioRequest.fio_request_id, fee);
      Alert.alert('Request rejected!');
      navigate('Accounts');
    } catch (err) {
      Alert.alert(err.message);
      log({
        description: '_handleReject',
        cause: err.message,
        location: 'ViewFIORequestScreen',
      });
    }
  };

  if (
    decryptedContent != null &&
    payerRole &&
    chain &&
    chainAccounts.length > 0 &&
    decryptedContent.offline_url == null
  ) {
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
            title={title}
            subTitle={getRequestTitle()}
            style={styles.header}
          />
          <View style={styles.spacer} />
          <KText>Payer: {fioRequest.payer_fio_address}</KText>
          <KText>Payee: {fioRequest.payee_fio_address}</KText>
          <KText>
            Amount: {decryptedContent.amount} {decryptedContent.token_code}
          </KText>
          <Text>Memo:</Text>
          <Text style={styles.link} onPress={() => copyToClipboard(decryptedContent.memo)}>{decryptedContent.memo}</Text>
          <KText>Timestamp: {fioRequest.time_stamp}</KText>
          <KText>Address: {decryptedContent.payee_public_address}</KText>
          <View style={styles.spacer} />
          <KButton
            title={'Pay and accept'}
            theme={'blue'}
            style={styles.button}
            icon={'check'}
            isLoading={loading}
            onPress={_handleTransferAndAccept}
          />
          <KButton
            title={'Reject'}
            theme={'brown'}
            style={styles.button}
            icon={'check'}
            isLoading={loading}
            onPress={_handleReject}
          />
        </View>
      </SafeAreaView>
    );
  } else if (decryptedContent != null && payerRole && chain && decryptedContent.offline_url == null) {
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
            title={title}
            subTitle={getRequestTitle()}
            style={styles.header}
          />
          <View style={styles.spacer} />
          <KText>Payer: {fioRequest.payer_fio_address}</KText>
          <KText>Payee: {fioRequest.payee_fio_address}</KText>
          <KText>
            Amount: {decryptedContent.amount} {decryptedContent.token_code}
          </KText>
          <Text>Memo:</Text>
          <Text style={styles.link} onPress={_copyMemoToClipboard}>{decryptedContent.memo}</Text>
          <KText>Timestamp: {fioRequest.time_stamp}</KText>
          <KText>Address: {decryptedContent.payee_public_address}</KText>
          <KText style={styles.errorMessage}>
            You have no imported {decryptedContent.chain_code} accounts to pay.
          </KText>
          <KButton
            title={'Connect account'}
            theme={'blue'}
            style={styles.button}
            onPress={() => navigate('ConnectAccount')}
            renderIcon={() => (
              <Image
                source={require('../../../assets/icons/accounts.png')}
                style={styles.buttonIcon}
              />
            )}
          />
          <KButton
            title={'Reject'}
            theme={'brown'}
            style={styles.button}
            icon={'check'}
            onPress={_handleReject}
          />
        </View>
      </SafeAreaView>
    );
  } else if (decryptedContent != null && payerRole && decryptedContent.offline_url == null) {
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
            title={title}
            subTitle={getRequestTitle()}
            style={styles.header}
          />
          <KText>
            Amount: {decryptedContent.amount} {decryptedContent.token_code}
          </KText>
          <Text>Memo:</Text>
          <Text style={styles.link} onPress={_copyMemoToClipboard}>{decryptedContent.memo}</Text>
          <KText>Address: {decryptedContent.payee_public_address}</KText>
          <KText style={styles.errorMessage}>
            This wallet does not support {decryptedContent.chain_code} accounts.
          </KText>
          <KText>
            You can send transfer to above address from any other wallet and
            mark request as paid (or reject).
          </KText>
          <KInput
            label={'Transaction Id'}
            placeholder={'Enter transaction id (if available)'}
            value={transactionId}
            multiline={true}
            onChangeText={setTransactionId}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
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
            title={'Accept and mark paid'}
            theme={'blue'}
            style={styles.button}
            icon={'check'}
            onPress={_handleExternalAccept}
          />
          <KButton
            title={'Reject'}
            theme={'brown'}
            style={styles.button}
            icon={'check'}
            onPress={_handleReject}
          />
        </View>
      </SafeAreaView>
    );
  } else if (decryptedContent != null && decryptedContent.offline_url != null) {
    // Private key delegate:
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
            title={'Delegated Key Request'}
            subTitle={decryptedContent.offline_url}
            style={styles.header}
          />
          <View style={styles.spacer} />
          <KText>Payer: {fioRequest.payer_fio_address}</KText>
          <KText>Payee: {fioRequest.payee_fio_address}</KText>
          <KText>
            Amount: {decryptedContent.amount} {decryptedContent.token_code}
          </KText>
          <Text>Memo:</Text>
          <Text style={styles.link} onPress={_copyMemoToClipboard}>{decryptedContent.memo}</Text>
          <KText>Timestamp: {fioRequest.time_stamp}</KText>
          <KText>Status: {fioRequest.status}</KText>
          <KText>Address: {decryptedContent.payee_public_address}</KText>
        </View>
      </SafeAreaView>
    );
  } else if (decryptedContent != null) {
    // My account is Payee - passive view
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
            title={title}
            subTitle={getRequestTitle()}
            style={styles.header}
          />
          <View style={styles.spacer} />
          <KText>Payer: {fioRequest.payer_fio_address}</KText>
          <KText>Payee: {fioRequest.payee_fio_address}</KText>
          <KText>
            Amount: {decryptedContent.amount} {decryptedContent.token_code}
          </KText>
          <Text>Memo:</Text>
          <Text style={styles.link} onPress={_copyMemoToClipboard}>{decryptedContent.memo}</Text>
          <KText>Timestamp: {fioRequest.time_stamp}</KText>
          <KText>Status: {fioRequest.status}</KText>
          <KText>Address: {decryptedContent.payee_public_address}</KText>
        </View>
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
            title={title}
            subTitle={getRequestTitle()}
            style={styles.header}
          />
          <View style={styles.spacer} />
          <KText>Payer: {fioRequest.payer_fio_address}</KText>
          <KText>Payee: {fioRequest.payee_fio_address}</KText>
          <KText>Timestamp: {fioRequest.time_stamp}</KText>
          <KText>Status: {fioRequest.status}</KText>
          <KText>Error: Unable to decrypt FIO Request content!</KText>
          <KButton
            title={'FIO Chat'}
            theme={'blue'}
            style={styles.button}
            icon={'check'}
            isLoading={loading}
            onPress={_handleContact}
          />
          <KButton
            title={'Reject'}
            theme={'brown'}
            style={styles.button}
            icon={'check'}
            onPress={_handleReject}
          />
        </View>
      </SafeAreaView>
    );
  }
};

export default connectAccounts()(ViewFIORequestScreen);
