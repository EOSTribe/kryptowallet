import React, { useState } from 'react';
import { Fio } from '@fioprotocol/fiojs';
import { SafeAreaView, View, Image, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import styles from './TransferScreen.style';
import { KHeader, KButton, KInput, KSelect, KText, OneIconButton, TwoIconsButtons } from '../../components';
import { connectAccounts } from '../../redux';
import { getAccount, transfer } from '../../eos/eos';
import { sendFioTransfer } from '../../eos/fio';
import { submitAlgoTransaction } from '../../algo/algo';
import { getChain, getEndpoint } from '../../eos/chains';
import { loadAccount, submitStellarPayment, createStellarAccount } from '../../stellar/stellar';
import web3Module from '../../ethereum/ethereum';
import { log } from '../../logger/logger';

const ResendTransferScreen = props => {

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState();
  // Ethereum transfer state:
  const [previewEthTransfer, setPreviewEthTransfer] = useState(false);
  const [pendingEthTransfer, setPendingEthTransfer] = useState(false);
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
    transferETH,
    transterERC20,
    getBalanceOfAccount,
    } = web3Module({
      tokenABI,
      tokenAddress,
      decimals: 18
    });

  const {
    addHistory,
    navigation: { navigate },
    accountsState: { accounts, addresses, keys, totals, history, config },
    route: {
      params: { transaction },
    },
  } = props;


  let fromAccount = null;
  if(fromAccount == null) {
    accounts.map((value, index, array) => {
      let valName = (value.address) ? value.address : value.accountName;
      if(valName && valName == transaction.sender) {
        fromAccount = value;
      }
    });
  }

  const getSender = () => {
    let sender = "";
    if(transaction.sender.address) {
      sender = transaction.sender.address;
    } else if(transaction.sender.accountName) {
      sender = transaction.sender.accountName;
    } else {
      sender = transaction.sender;
    }
    if(sender.length > 20) {
      return sender.substring(0,20) + "..";
    }
    return sender;
  };

  const getReceiver = () => {
    if(transaction.isFioAddress) {
      return transaction.toFioAddress;
    } else {
      return transaction.receiver;
    }
  };

  const addTransactionToHistory = newtrx => {
    if(transaction.isFioAddress) {
      newtrx.isFioAddress = transaction.isFioAddress;
      newtrx.toFioAddress = transaction.toFioAddress;
    }
    addHistory(newtrx);
    Alert.alert('Transfer completed: ' + newtrx.txid);
    navigate('Transactions');
  };

  const prepareETHTransfer = async (from, to, amount) => {
      const gasPrice = await getCurrentGasPrice(transaction.chain);
      setEthGasPrice(gasPrice);
      const ethBalanceInWei = await getBalanceOfAccount(transaction.chain, from.address);
      const ethBalanceInEth = parseFloat(ethBalanceInWei/ethDivider).toFixed(4);
      setEthBalance(ethBalanceInEth);
      setEthFromAddress(from.address);
      setEthFromPrivateKey(from.privateKey);
      setEthToAddress(to);
      setEthFloatAmount(amount);
      const estimatedFee = parseFloat((gasPrice*ethGasLimit)/ethDivider).toFixed(4);
      setEthEstimatedFee(estimatedFee);
      const totalAmount = parseFloat(amount) + parseFloat(estimatedFee)
      setEthTotalAmount(totalAmount);
      if (ethBalanceInEth > totalAmount) {
        setPreviewEthTransfer(true);
      } else {
        Alert.alert('Insufficient balance to send transfer!');
      }
  }

  const sendETHTransfer = async () => {
    if(pendingEthTransfer) {
      Alert.alert(`Waiting for pending ${transaction.chain} transfer!`);
    }
    setPendingEthTransfer(true);
    const keypair = await createKeyPair(transaction.chain, ethFromPrivateKey);
    const result = await transferETH(ftransaction.chain, keypair, ethToAddress, ethFloatAmount, ethGasLimit, ethGasPrice);
    setPendingEthTransfer(false);
    // Save transaction to History:
    const txRecord = {
      "chain": transaction.chain,
      "sender": ethFromAddress,
      "receiver": ethToAddress,
      "amount": ethFloatAmount,
      "isFioAddress": isFioAddress,
      "toFioAddress": toFioAddress,
      "txid": result.transactionHash,
      "date": new Date(),
    };
    addTransactionToHistory(txRecord);
    Alert.alert(`${transaction.chain} Transfer submitted!`);
    setPreviewEthTransfer(false);
  }

  const rejectETHTransfer = () => {
    setPreviewEthTransfer(false);
  }

  const _handleTransfer = async () => {
    if(fromAccount == null) {
      Alert.alert('Source account not found in wallet!');
      return;
    }
    if(loading) {
      Alert.alert('Already processing transfer!');
      return;
    }
    setLoading(true);
    // Validate amount:
    const floatAmount = parseFloat(amount);
    if (isNaN(floatAmount)) {
      Alert.alert('Please input valid amount');
      return;
    }

    let chain = getChain(transaction.chain);

    // From account validation
    try {
      setLoading(true);
      if (transaction.chain === 'ALGO') {
        await submitAlgoTransaction(
          fromAccount,
          transaction.receiver,
          floatAmount,
          transaction.memo,
          addTransactionToHistory,
        );
      } else if (transaction.chain === 'XLM') {
        await submitStellarPayment(
          fromAccount,
          transaction.receiver,
          floatAmount,
          transaction.memo,
          addTransactionToHistory,
        );
      } else if (fromAccount.chainName === 'FIO') {
        await sendFioTransfer(
          fromAccount,
          transaction.receiver,
          floatAmount,
          transaction.memo,
          addTransactionToHistory,
        );
      } else if (fromAccount.chainName === 'ETH' || fromAccount.chainName === 'BNB' || fromAccount.chainName === 'MATIC' || fromAccount.chainName === 'AURORA' || fromAccount.chainName === 'TELOSEVM') {
        let receiver = transaction.receiver;
        prepareETHTransfer(fromAccount, receiver, floatAmount);
      } else if (chain) {
        // Any of supported EOSIO chains:
        let result = await transfer(
          transaction.receiver,
          floatAmount,
          transaction.memo,
          fromAccount,
          chain);
        transaction.txid = result.transaction_id;
        transaction.amount = floatAmount;
        transaction.date = new Date();
        addTransactionToHistory(transaction);
      } else {
        Alert.alert('Unsupported transfer state!');
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Alert.alert(err.message);
      log({
        description: '_handleTransfer - resend transaction',
        transaction: transaction,
        cause: err.message,
        location: 'ResendTransferScreen',
      });
    } finally {
      setLoading(false);
    }
  };

  const _navigateHistory = () => {
    navigate('Transactions');
  }


if (previewEthTransfer) {
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
          <KText>Amount: {ethFloatAmount} {transaction.chain}</KText>
          <KText>Gas fee: {ethEstimatedFee} {transaction.chain} (Estimated)</KText>
          <KText>Total: {ethTotalAmount} {transaction.chain}</KText>
          <KText>Balance: {ethBalance} {transaction.chain}</KText>
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
              title={'Resend transfer'}
              style={styles.header}
            />
            <KText>From: {getSender()}</KText>
            <KText>To: {getReceiver()}</KText>
            <KText>Memo: {transaction.memo}</KText>
            <KInput
              label={'Enter amount to send'}
              value={amount}
              placeholder={'Original amount sent: '+transaction.amount}
              onChangeText={setAmount}
              containerStyle={styles.inputContainer}
              autoCapitalize={'none'}
              keyboardType={'numeric'}
            />
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
            <View style={styles.spacer} />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }

};

export default connectAccounts()(ResendTransferScreen);
