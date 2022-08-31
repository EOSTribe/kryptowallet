import React, { useEffect, useState } from 'react';
import { Fio } from '@fioprotocol/fiojs';
import { SafeAreaView, View, Image, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './TransferScreen.style';
import { KHeader, KButton, KInput, KDomainAddressInput, KSelect, KText, OneIconButton, TwoIconsButtons } from '../../components';
import { connectAccounts } from '../../redux';
import { getAccount, transfer } from '../../eos/eos';
import { sendFioTransfer } from '../../eos/fio';
import { submitAlgoTransaction } from '../../algo/algo';
import { getChain, getEndpoint } from '../../eos/chains';
import { loadAccount, submitStellarPayment, createStellarAccount } from '../../stellar/stellar';
import web3Module from '../../ethereum/ethereum';
import { getNativeTokenName } from '../../external/blockchains';

import { log } from '../../logger/logger';


const TransferScreen = props => {
  const [UDAddress, setUDAddress] = useState('');
  const [toAddress, setToAddress] = useState()
  const [fromAccount, setFromAccount] = useState();
  const [toAccountName, setToAccountName] = useState('');
  const [isLiveStellarAccount, setIsLiveStellarAccount] = useState(false);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [toFioAddress, setToFioAddress] = useState();
  const [isFioAddress, setIsFioAddress] = useState(false);
  const [toActor, setToActor] = useState('');
  const [toPubkey, setToPubkey] = useState('');
  const [toFioPubkey, setToFioPubkey] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressInvalidMessage, setAddressInvalidMessage] = useState();
  // Ethereum transfer state:
  const [pendingEthTransfer, setPendingEthTransfer] = useState(false);
  const [previewEthTransfer, setPreviewEthTransfer] = useState(false);
  const [ethGasPrice, setEthGasPrice] = useState(0.001);
  const [ethGasLimit, setEthGasLimit] = useState(21000);
  const [ethBalance, setEthBalance] = useState(0);
  const [ethFromAddress, setEthFromAddress] = useState();
  const [ethFromPrivateKey, setEthFromPrivateKey] = useState();
  const [ethToAddress, setEthToAddress] = useState('');
  const [ethFloatAmount, setEthFloatAmount] = useState(0.0);
  const [ethEstimatedFee, setEthEstimatedFee] = useState(0.0);
  const [ethTotalAmount, setEthTotalAmount] = useState(0.0);
  const ethDivider = 1000000000000000000;
  const tokenABI = require('../../ethereum/abi.json');
  const tokenAddress = "";
  const {
    createKeyPair,
    getCurrentGasPrice,
    getCurrentETHGasLimit,
    transferETH,
    getBalanceOfAccount,
  } = web3Module({
    tokenABI,
    tokenAddress,
    decimals: 18
  });

  const {
    addAddress,
    addHistory,
    navigation: { navigate },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const fioEndpoint = getEndpoint('FIO');

  useEffect(() => {
    if (UDAddress)
      setToAddress(UDAddress);
  }, [UDAddress])

  const isValidXLMAddress = address => {
    return (address != null && address.startsWith('G') && address.length == 56);
  }

  const processToPubkeyUpdate = async toAccountPubkey => {
    const chain = getChain(fromAccount.chainName);
    if (chain && chain.name === 'FIO') {
      setToActor('');
      setToPubkey(toAccountPubkey);
    } else if (chain) {
      // EOSIO chain
      const [toActorValue, toPubkeyValue] = toAccountPubkey.split(',');
      const toAccountInfo = await getAccount(toActorValue, chain);
      if (!toAccountInfo) {
        Alert.alert(
          'Error fetching account data for ' +
          toActor +
          ' on chain ' +
          fromAccount.chainName,
        );
        return;
      }
      setToActor(toActorValue);
      setToPubkey(toPubkeyValue);
    } else {
      // Non EOSIO chain - no 'actor,pubkey' split
      setToActor('');
      setToPubkey(toAccountPubkey);
    }
  };

  const loadToPubkey = async address => {
    let chainCode =
      fromAccount.chainName === 'Telos' ? 'TLOS' : fromAccount.chainName;
    fetch(fioEndpoint + '/v1/chain/get_pub_address', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_address: address,
        chain_code: chainCode,
        token_code: chainCode,
      }),
    })
      .then(response => response.json())
      .then(json => {
        processToPubkeyUpdate(json.public_address);
      })
      .catch(error =>
        log({
          description:
            'loadToPubkey - fetch [' +
            chainCode +
            '] ' +
            fioEndpoint +
            '/v1/chain/get_pub_address [' +
            address +
            ']',
          cause: error,
          location: 'TransferScreen',
        }),
      );
    // Load FIO public key as well:
    if (chainCode !== 'FIO') {
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
        .then(json => setToFioPubkey(json.public_address))
        .catch(error =>
          log({
            description:
              'loadToPubkey - fetch [FIO] ' +
              fioEndpoint +
              '/v1/chain/get_pub_address [' +
              address +
              ']',
            cause: error,
            location: 'TransferScreen',
          }),
        );
    }
  };

  const _validateAddress = address => {
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

  const _validateStellarAddress = address => {
    const callback = json => {
      if (json["status"] && json["status"] === 404) {
        setIsLiveStellarAccount(false);
      } else if (json['balances']) {
        setIsLiveStellarAccount(true);
      } else {
        setIsLiveStellarAccount(false);
      }
    };
    if (isValidXLMAddress(address)) {
      loadAccount(address, callback);
    }
  };

  const updateAvailableState = (regcount, address, error) => {
    if (regcount === 0) {
      setAddressInvalidMessage('Invalid FIO address!');
      setToPubkey('');
    } else if (regcount === 1) {
      setAddressInvalidMessage('');
      loadToPubkey(address);
    } else if (error) {
      setToPubkey('');
      setAddressInvalidMessage('Error validating FIO address');
      log({
        description:
          '_validateAddress - fetch ' + fioEndpoint + '/v1/chain/avail_check',
        cause: error,
        location: 'TransferScreen',
      });
    }
  };

  const _handleFromAccountChange = value => {
    const parseInfo = async () => {
      const ethBalanceInWei = await getBalanceOfAccount(value.chainName, value.address);
      const ethBalanceInEth = parseFloat(ethBalanceInWei / ethDivider).toFixed(4);
      setEthBalance(ethBalanceInEth);
    }
    setFromAccount(value);
    if (value && value.chainName !== 'FIO') {
      setAddressInvalidMessage('');
      if (value.chainName === 'ETH' || value.chainName === 'BNB' || value.chainName === 'MATIC' || value.chainName === 'AURORA' || value.chainName === 'TELOSEVM') {
        parseInfo();
      }
    }
  };

  const _handleToAccountChange = async (value) => {
    if (!fromAccount) {
      Alert.alert('Select from account first!');
      return;
    }

    setToAddress(value);
    // trim white space if present:
    if (value.indexOf(' ') >= 0) {
      value = value.trim();
    }
    // Then validate FIO address (if set):
    if (fromAccount.chainName === 'FIO') {
      if (value && value.indexOf('@') > 0) {
        _validateAddress(value);
        setIsFioAddress(true);
        setToFioAddress(value);
      } else if (value && value.startsWith('FIO') && value.length > 10) {
        setIsFioAddress(false);
        setToPubkey(value);
        setAddressInvalidMessage('');
      } else {
        setIsFioAddress(false);
        setAddressInvalidMessage(
          'Must be FIO address or public key for FIO transfer!',
        );
      }
    } else if (value.indexOf('@') > 0) {
      _validateAddress(value);
      setIsFioAddress(true);
      setToFioAddress(value);
    } else if (fromAccount.chainName === 'XLM') {
      setIsFioAddress(false);
      setToFioAddress('');
      setAddressInvalidMessage('');
      _validateStellarAddress(value);
    } else {
      setIsFioAddress(false);
      setToFioAddress('');
      setAddressInvalidMessage('');
    }
    setToAccountName(value);
  };

  const addTransactionToHistory = transaction => {
    transaction.isFioAddress = isFioAddress;
    transaction.toFioAddress = toFioAddress;
    addHistory(transaction);
    Alert.alert('Transfer completed: ' + transaction.txid);
    navigate('Transactions');
  };

  const addFIOAddressToAddressbook = () => {
    if (toFioAddress && toFioPubkey) {
      let accountHash = Fio.accountHash(toFioPubkey);
      let name = toFioAddress.split('@')[0];
      let addressJson = {
        name: name,
        address: toFioAddress,
        actor: accountHash,
        publicKey: toFioPubkey,
      };
      let matchingAddresses = addresses.filter(
        (item, index) => item.address === toFioAddress,
      );
      if (matchingAddresses.length === 0) {
        addAddress(addressJson);
      }
    } else {
      log({
        description:
          'addFIOAddressToAddressbook: Failed to load To FIO address and public key',
        cause: 'Failed to load To FIO address and public key',
        location: 'TransferScreen',
      });
    }
  };

  const prepareETHTransfer = async (from, to, amount) => {
    try {
      const gasPrice = await getCurrentGasPrice(from.chainName);
      setEthGasPrice(gasPrice);
      const ethBalanceInWei = await getBalanceOfAccount(from.chainName, from.address);
      const ethBalanceInEth = parseFloat(ethBalanceInWei / ethDivider).toFixed(4);
      setEthBalance(ethBalanceInEth);
      setEthFromAddress(from.address);
      setEthFromPrivateKey(from.privateKey);
      setEthToAddress(to);
      setEthFloatAmount(amount);

      if (amount < ethBalanceInEth) {
        const gasLimitation = await getCurrentETHGasLimit(from.chainName, fromAccount, amount.toString(), toAddress);
        setEthGasLimit(gasLimitation);
        const estimatedFee = parseFloat((gasPrice * gasLimitation) / ethDivider).toFixed(4);
        setEthEstimatedFee(estimatedFee);
        const totalAmount = parseFloat(amount) + parseFloat(estimatedFee)
        setEthTotalAmount(totalAmount);
        if (ethBalanceInEth > totalAmount) {
          setPreviewEthTransfer(true);
        } else {
          Alert.alert('Insufficient balance to send transfer!');
        }
      }
      else {
        Alert.alert('Insufficient balance to send transfer!');
      }
    } catch (error) {
      console.log("error:", error);
      if (error.toString().includes('Provided address'))
        Alert.alert('The Provided sending to Address is invalid!');
    }
  }

  const sendETHTransfer = async () => {
    if (pendingEthTransfer) {
      Alert.alert(`Waiting for pending ${fromAccount.chainName} transfer!`);
      return;
    }
    setPendingEthTransfer(true);
    const keypair = await createKeyPair(fromAccount.chainName, ethFromPrivateKey);
    const result = await transferETH(fromAccount.chainName, keypair, ethToAddress, ethFloatAmount, ethGasLimit, ethGasPrice);
    setPendingEthTransfer(false);
    // Save transaction to History:
    const txRecord = {
      "chain": fromAccount.chainName,
      "sender": ethFromAddress,
      "receiver": ethToAddress,
      "amount": ethFloatAmount,
      "memo": memo,
      "isFioAddress": isFioAddress,
      "toFioAddress": toFioAddress,
      "txid": result.transactionHash,
      "date": new Date(),
    };
    addTransactionToHistory(txRecord);
    Alert.alert(`${fromAccount.chainName} Transfer submitted!`);
    setPreviewEthTransfer(false);
  }

  const rejectETHTransfer = () => {
    setPreviewEthTransfer(false);
    setEthBalance(0);
  }

  const _handleTransfer = async () => {
    setLoading(true);

    if (!fromAccount || !toAddress || !amount) {
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

    // EOSIO chain (undefined for not EOSIO account)
    let chain = getChain(fromAccount.chainName);

    // If to account is FIO address:
    if (isFioAddress) {
      if (!toPubkey) {
        await _validateAddress(toAddress);
      }
      if (!toPubkey) {
        Alert.alert(
          'Could not determine receiver public key for ' +
          fromAccount.chainName +
          ' registered to ' +
          toAddress,
        );
        setLoading(false);
        return;
      }
      // Add FIO address to addressbook:
      addFIOAddressToAddressbook();
    }

    // EOSIO to actor name validation:
    let actorName = isFioAddress ? toActor : toAddress;
    if (chain && chain.name !== 'FIO') {
      try {
        let toAccount = await getAccount(actorName, chain);
        if (!toAccount) {
          Alert.alert('Please input valid account name');
          setLoading(false);
          return;
        }
      } catch (e) {
        Alert.alert('Please input valid account name');
        setLoading(false);
        return;
      }
    }

    // From account validation
    try {
      setLoading(true);
      if (fromAccount.chainName === 'ALGO') {
        let receiver = toPubkey ? toPubkey : toAddress;
        await submitAlgoTransaction(
          fromAccount,
          receiver,
          floatAmount,
          memo,
          addTransactionToHistory,
        );
      } else if (fromAccount.chainName === 'XLM') {
        let receiver = toPubkey ? toPubkey : toAddress;
        if (isValidXLMAddress(receiver)) {
          if (isLiveStellarAccount) {
            await submitStellarPayment(
              fromAccount,
              receiver,
              floatAmount,
              memo,
              addTransactionToHistory,
            );
          } else {
            //Double check isLiveStellarAccount for FIO use case:
            const callback = async json => {
              // XLM address doesn't exists
              if (json["status"] && json["status"] === 404) {
                setIsLiveStellarAccount(false);
                await createStellarAccount(
                  fromAccount,
                  receiver,
                  floatAmount,
                  memo,
                  addTransactionToHistory,
                );
              } else { // Address exists:
                setIsLiveStellarAccount(true);
                await submitStellarPayment(
                  fromAccount,
                  receiver,
                  floatAmount,
                  memo,
                  addTransactionToHistory,
                );
              }
            };
            loadAccount(receiver, callback);
          }
        } else {
          Alert.alert('Invalid XLM to address: ' + receiver);
        }
      } else if (fromAccount.chainName === 'FIO') {
        await sendFioTransfer(
          fromAccount,
          toPubkey,
          floatAmount,
          memo,
          addTransactionToHistory,
        );
      } else if (fromAccount.chainName === 'ETH' || fromAccount.chainName === 'BNB' || fromAccount.chainName === 'MATIC' || fromAccount.chainName === 'AURORA' || fromAccount.chainName === 'TELOSEVM') {
        let receiver = toPubkey ? toPubkey : toAddress;
        prepareETHTransfer(fromAccount, receiver, floatAmount, null);
      } else if (chain) {
        // Any of supported EOSIO chains:
        let result = await transfer(actorName, floatAmount, memo, fromAccount, chain);
        // Save transaction to History:
        const txRecord = {
          "chain": chain.name,
          "sender": fromAccount.accountName,
          "receiver": actorName,
          "amount": floatAmount,
          "memo": memo,
          "isFioAddress": isFioAddress,
          "toFioAddress": toFioAddress,
          "txid": result.transaction_id,
          "date": new Date(),
        };
        addTransactionToHistory(txRecord);
      } else {
        Alert.alert('Unsupported transfer state!');
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Alert.alert(err.message);
      log({
        description: '_handleTransfer - transfer: ' + fromAccount.chainName,
        cause: err.message,
        location: 'TransferScreen',
      });
    } finally {
      setLoading(false);
    }
  };

  const _navigateHistory = () => {
    navigate('Transactions');
  }

  if (accounts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <View style={styles.inner}>
            <KHeader
              title={'Transfer not available'}
              subTitle={'No accounts in wallet'}
              style={styles.header}
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  } else if (previewEthTransfer) {
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
            <KText>From: {ethFromAddress}</KText>
            <KText>To: {ethToAddress}</KText>
            <KText>Memo: {memo}</KText>
            <KText>Amount: {ethFloatAmount} {getNativeTokenName(fromAccount.chainName)}</KText>
            <KText>Gas fee: {ethEstimatedFee} {getNativeTokenName(fromAccount.chainName)} (Estimated)</KText>
            <KText>Total: {ethTotalAmount} {getNativeTokenName(fromAccount.chainName)}</KText>
            <KText>Balance: {ethBalance} {getNativeTokenName(fromAccount.chainName)}</KText>
            <View style={styles.spacer} />
            <TwoIconsButtons
              onIcon1Press={sendETHTransfer}
              onIcon2Press={rejectETHTransfer}
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
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <View style={styles.inner}>
            <KHeader
              title={'Transfer coins'}
              subTitle={'Move funds to another account'}
              style={styles.header}
            />
            <KSelect
              label={'From account'}
              items={accounts.map(item => ({
                label: `${item.chainName}: ${(item.chainName === 'FIO' || item.chainName === 'XLM' || item.chainName === 'ETH' || item.chainName === 'BNB' || item.chainName === 'MATIC' || item.chainName === 'AURORA' || item.chainName === 'TELOSEVM') ? item.address : item.accountName
                  }`,
                value: item,
              }))}
              onValueChange={_handleFromAccountChange}
              containerStyle={styles.inputContainer}
            />
            <KDomainAddressInput
              label={'Sending to'}
              placeholder={'Enter address or domain name (ENS/UD/FIO)'}
              value={toAccountName}
              chainName={fromAccount?.chainName}
              setUDAddress={setUDAddress}
              onChangeText={_handleToAccountChange}
              containerStyle={styles.inputContainer}
              onPasteHandler={_handleToAccountChange}
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
            {fromAccount && (fromAccount.chainName === 'ETH' || fromAccount.chainName === 'BNB' || fromAccount.chainName === 'MATIC' || fromAccount.chainName === 'AURORA' || fromAccount.chainName === 'TELOSEVM') ?
              <View style={styles.balanceView}>
                <KText style={styles.blueLabel}> Available Balance: </KText>
                <KText> {ethBalance} {getNativeTokenName(fromAccount.chainName)}</KText>
              </View>
              :
              <KInput
                label={'Memo'}
                placeholder={'Optional memo'}
                value={memo}
                onChangeText={setMemo}
                containerStyle={styles.inputContainer}
                autoCapitalize={'none'}
              />
            }
            <View style={styles.spacer} />
            <KButton
              title={'Submit transfer'}
              theme={'blue'}
              style={styles.button}
              isLoading={loading}
              onPress={_handleTransfer}
            />
            <View style={styles.spacer} />
            <OneIconButton
              onIconPress={_navigateHistory}
              icon={() => (
                <Image
                  source={require('../../../assets/icons/history.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView >
    );
  }
};

export default connectAccounts()(TransferScreen);
