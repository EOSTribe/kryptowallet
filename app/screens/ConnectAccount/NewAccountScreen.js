import React from 'react';
import { SafeAreaView, View, TouchableOpacity, Alert, Text, Image } from 'react-native';
import styles from './ConnectAccountScreen.style';
import { KHeader, KText, KButton } from '../../components';
import { connectAccounts } from '../../redux';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_BLUE } from '../../theme/colors';
import { web3NFTModule } from '../../ethereum/ethereum';
import { isEVMNetwork } from '../../external/blockchains';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import ecc from 'eosjs-ecc-rn';
import algosdk from 'algosdk';
import { createKeyPair } from '../../stellar/stellar';
import Wallet from 'ethereumjs-wallet';
import { log } from '../../logger/logger';


const NewAccountScreen = props => {
  const {
    connectAccount,
    addKey,
    navigation: { navigate, goBack },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const multichainAccount = accounts.filter((value, index, array) => {
    return (value != null && 
      ( value.chainName == "ETH" || 
        value.chainName == "BNB" || 
        value.chainName == "MATIC" || 
        value.chainName == "AURORA" || 
        value.chainName == "TELOSEVM"));
  });

  const telosAccount = accounts.filter((value, index, array) => {
    return (value != null && value.chainName === 'Telos');
  });

  const fioAccount = accounts.filter((value, index, array) => {
    return (value != null && value.chainName === 'FIO');
  });

  const xlmAccount = accounts.filter((value, index, array) => {
    return (value != null && value.chainName === 'XLM');
  });

  const algoAccount = accounts.filter((value, index, array) => {
    return (value != null && value.chainName === 'ALGO');
  });

    const _handleCreateAlgorandAccount = () => {
    try {
      var account = algosdk.generateAccount();
      var address = account.addr;
      var accountName =
        address.substring(0, 4) +
        '..' +
        address.substring(address.length - 4, address.length);
      var mnemonic = algosdk.secretKeyToMnemonic(account.sk);
      var algoAccount = {
        accountName,
        mnemonic,
        chainName: 'ALGO',
        account: account,
      };
      connectAccount(algoAccount);
      addKey({ private: mnemonic, public: address });
    } catch (err) {
      log({
        description: 'Error create/add Algorand account',
        cause: err,
        location: 'MenuScreen',
      });
    }
  };

  const _handleCreateStellarAccount = () => {
    try {
      const stellarKeys = createKeyPair();
      const privateKey = stellarKeys.secret();
      const address = stellarKeys.publicKey();
      var xlmAccount = {
        address: address,
        privateKey: privateKey,
        chainName: 'XLM',
      };
      connectAccount(xlmAccount);
      addKey({ private: privateKey, public: address });
    } catch (err) {
      log({
        description: 'Error create/add Stellar account',
        cause: err,
        location: 'MenuScreen',
      });
    }
  };

  const _handleCreateEthereumAccount = (name) => {
    let privateKey = '';
    let publicKey = '';
    let address = '';

    let evmAccounts = accounts.filter(cell => isEVMNetwork(cell.chainName));
    let sameNetworkAccounts = evmAccounts.filter(cell => cell.chainName === name);
    if (evmAccounts.length > 0 && sameNetworkAccounts.length === 0) {
      privateKey = evmAccounts[0].privateKey;
      publicKey = evmAccounts[0].publicKey;
      address = evmAccounts[0].address;
    }
    else {
      const newEth = Wallet.generate(false);
      privateKey = newEth.getPrivateKeyString();
      publicKey = newEth.getPublicKeyString();
      address = newEth.getAddressString();
    }

    const account = { address: address, privateKey: privateKey, publicKey: publicKey, chainName: name };
    connectAccount(account);
    addKey({ private: privateKey, public: publicKey });
  };


  var multiAccountButton = null;
  if (multichainAccount.length == 0) {
    multiAccountButton = (
      <KButton
        title={'Create New Multichain Account'}
        style={styles.button}
        onPress={() => _handleCreateEthereumAccount('ETH')}
      />
    );
  }

  var telosAccountButton = null;
  if (telosAccount.length == 0) {
    telosAccountButton = (
      <KButton
        title={'Create New Telos Account'}
        style={styles.button}
        onPress={() => navigate('CreateTelosAccount')}
      />
    );
  }

  var fioAccountButton = null;
  if (fioAccount.length == 0) {
    fioAccountButton = (
      <KButton
        title={'Create New FIO Account'}
        style={styles.button}
        onPress={() => navigate('RegisterFIOAddress')}
      />
    );
  }

  var xlmAccountButton = null;
  if (xlmAccount.length == 0) {
    xlmAccountButton = (
      <KButton
        title={'Create New Stellar Account'}
        style={styles.button}
        onPress={_handleCreateStellarAccount}
      />
    );
  }

  var algoAccountButton = null;
  if (algoAccount.length == 0) {
    algoAccountButton = (
      <KButton
        title={'Create New Algorand Account'}
        style={styles.button}
        onPress={_handleCreateAlgorandAccount}
      />
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <KHeader title={'Create or import account'} style={styles.header} />
          {multiAccountButton}
          {telosAccountButton}
          {fioAccountButton}
          {xlmAccountButton}
          {algoAccountButton}
          <KButton
            title={'Import existing account'}
            style={styles.button}
            onPress={() => navigate('ConnectAccount')}
          />
          <View style={styles.spacer} />
          <Text style={styles.message}>Multichain account supported networks:</Text>
          <Text style={styles.chainName}><Image source={require('../../../assets/chains/eth.png')} style={styles.chainIcon} /> Ethereum</Text>
          <Text style={styles.chainName}><Image source={require('../../../assets/chains/polygon.png')} style={styles.chainIcon} /> Polygon</Text>
          <Text style={styles.chainName}><Image source={require('../../../assets/chains/aurora.png')} style={styles.chainIcon} /> Aurora</Text>
          <Text style={styles.chainName}><Image source={require('../../../assets/chains/bsc.png')} style={styles.chainIcon} /> Binance</Text>
          <Text style={styles.chainName}><Image source={require('../../../assets/chains/telosevm.png')} style={styles.chainIcon} /> Telos EVM</Text>
      </View>
  </SafeAreaView>
  );

};

export default connectAccounts()(NewAccountScreen);
