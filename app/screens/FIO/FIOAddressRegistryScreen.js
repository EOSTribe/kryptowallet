import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Text,
  Linking,
  Alert,
} from 'react-native';
import ChainAddressItem from './components/ChainAddressItem';
import ConnectAddressItem from './components/ConnectAddressItem';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import ecc from 'eosjs-ecc-rn';
import { fioAddPublicAddress, fioAddExternalAddress } from '../../eos/fio';
import { log } from '../../logger/logger';
import styles from './FIOCommon.style';
import { KHeader, KText, KButton, FiveIconsButtons } from '../../components';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { findIndex } from 'lodash';
import { getEndpoint } from '../../eos/chains';
import { getKeyPair } from '../../stellar/stellar';


const FIOAddressRegistryScreen = props => {
  const [executionCount, setExecutionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fioFee, setFioFee] = useState(0);
  var initialConnectedAccounts = [];
  var initialFilteredAccounts = [];
  const [connectedHeader, setConnectedHeader] = useState('');
  const [connectedAccounts, setConnectedAccounts] = useState(
    initialConnectedAccounts,
  );
  const [disconnectedHeader, setDisconnectedHeader] = useState('');
  const [filteredAccounts, setFilteredAccounts] = useState(
    initialFilteredAccounts,
  );

  const {
    connectAccount,
    deleteAccount,
    navigation: { navigate, goBack },
    route: {
      params: { fioAccount },
    },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const blockchains = ['EOS', 'TLOS', 'FIO', 'XLM', 'ALGO', 'ETH', 'BNB', 'MATIC', 'AURORA'];

  const fioDivider = 1000000000;
  const privateKey = fioAccount.privateKey;
  const fioKey = Ecc.privateToPublic(privateKey);
  const fioEndpoint = getEndpoint('FIO');

  const name = "FIO:" + fioAccount.address;


  const checkRegPubkey = async account => {
    var chainName = account.chainName;
    if (chainName === 'Telos') {
      chainName = 'TLOS';
    }
    fetch(fioEndpoint + '/v1/chain/get_pub_address', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_address: fioAccount.address,
        chain_code: chainName,
        token_code: chainName,
      }),
    })
      .then(response => response.json())
      .then(json => updateAccountLists(account, json))
      .catch(error =>
        log({
          description:
            'checkRegPubkey - fetch ' +
            fioEndpoint +
            '/v1/chain/get_pub_address',
          cause: error,
          location: 'FIOAddressRegistryScreen',
        }),
      );
  };

  const getItemFromAccount = (account, external) => {
    const chainName = account.chainName;
    var address = account.accountName;
    if (chainName === 'FIO' || chainName === 'XLM' || chainName === 'ETH' || chainName === 'BNB' || chainName === 'MATIC' || chainName === 'AURORA') {
      address = account.address;
    } else if (chainName === 'ALGO' && account.account !== undefined && account.account.addr !== undefined) {
      address = account.account.addr;
    }
    return { chainName: chainName, address: address, external: external };
  }

  const addAccountToConnectedList = (account, external) => {
    if (connectedHeader === '') {
      setConnectedHeader('Connected accounts to this address:');
    }
    const chainName = account.chainName;
    var address = account.accountName;
    if (chainName === 'FIO' || chainName === 'XLM' || chainName === 'ETH' || chainName === 'BNB' || chainName === 'MATIC' || chainName === 'AURORA') {
      address = account.address;
    } else if (chainName === 'ALGO') {
      if (account.account !== undefined && account.account.addr !== undefined) {
        address = account.account.addr;
      } else {
        address = account.address;
      }
    }
    const item = getItemFromAccount(account, external);
    var newConnectedAccounts = [...initialConnectedAccounts, item];
    initialConnectedAccounts.push(item);
    setConnectedAccounts(newConnectedAccounts);
  };

  const appendAccountToConnectedList = (account, external) => {
    if (connectedHeader === '') {
      setConnectedHeader('Connected accounts to this address:');
    }
    const item = getItemFromAccount(account, external);
    var newConnectedAccounts = [...connectedAccounts, item];
    setConnectedAccounts(newConnectedAccounts);
  };

  const addAccountToFilteredList = account => {
    if (disconnectedHeader === '') {
      setDisconnectedHeader('Connect accounts to this address:');
    }
    var newFilteredAccounts = [...initialFilteredAccounts, account];
    initialFilteredAccounts.push(account);
    setFilteredAccounts(newFilteredAccounts);
  };

  const updateAccountLists = (account, json) => {
    let accountPubkeyEntry = json.public_address;
    var accPubkey = '';
    if (account.chainName === 'ALGO') {
      accPubkey = account.account.addr;
    } else if (account.chainName === 'XLM' || account.chainName === 'ETH' || account.chainName === 'FIO' || account.chainName === 'BNB' || account.chainName === 'MATIC' || chainName === 'AURORA') {
      accPubkey = account.address;
    } else if (account.privateKey) {
      accPubkey = ecc.privateToPublic(account.privateKey);
    }
    if (accountPubkeyEntry && accountPubkeyEntry.indexOf(',') > 0) {
      var [, regPubkey] = accountPubkeyEntry.split(',');
      if (accPubkey === regPubkey) {
        addAccountToConnectedList(account, false);
      } else {
        addAccountToFilteredList(account);
      }
    } else if (accountPubkeyEntry) {
      if (accPubkey === accountPubkeyEntry) {
        addAccountToConnectedList(account, false);
      } else {
        addAccountToFilteredList(account);
      }
    } else {
      addAccountToFilteredList(account);
    }
  };

  const _handleConnectAccountToAddress = async account => {
    try {
      setLoading(true);
      setFilteredAccounts(
        filteredAccounts.filter(function (item) {
          return item !== account;
        }),
      );
      appendAccountToConnectedList(account);
      if (account.chainName === 'ALGO') {
        const res = await fioAddExternalAddress(
          fioAccount,
          'ALGO',
          account.account.addr,
          fioFee,
        );
        if (res && res.transaction_id) {
          Alert.alert('Successfully added in tx ' + res.transaction_id);
        } else {
          let error = {
            description: 'Failed _handleConnectAccountToAddress',
            method: 'fioAddExternalAddress',
            location: 'FIOAddressRegistryScreen',
            cause: res,
            fioAccount: fioAccount.address,
            account: account.account.addr,
            fioFee: fioFee,
          };
          log(error);
          Alert.alert('Failed to link ALGO account to FIO address.');
        }
      } else if (account.chainName === 'XLM') {
        const res = await fioAddExternalAddress(
          fioAccount,
          'XLM',
          account.address,
          fioFee,
        );
        if (res && res.transaction_id) {
          Alert.alert('Successfully added in tx ' + res.transaction_id);
        } else {
          let error = {
            description: 'Failed _handleConnectAccountToAddress',
            method: 'fioAddExternalAddress',
            location: 'FIOAddressRegistryScreen',
            cause: res,
            fioAccount: fioAccount.address,
            account: account.address,
            fioFee: fioFee,
          };
          log(error);
          Alert.alert('Failed to link Stellar account to FIO address.');
        }
      } else if (account.chainName === 'ETH' || account.chainName === 'BNB' || account.chainName === 'MATIC' || chainName === 'AURORA') {
        const res = await fioAddExternalAddress(
          fioAccount,
          account.chainName,
          account.address,
          fioFee,
        );
        console.log(res);
        if (res && res.transactionHash) {
          Alert.alert('Successfully added in tx ' + res.transactionHash);
        } else {
          let error = {
            description: 'Failed _handleConnectAccountToAddress',
            method: 'fioAddExternalAddress',
            location: 'FIOAddressRegistryScreen',
            cause: res,
            fioAccount: fioAccount.address,
            account: account.address,
            fioFee: fioFee,
          };
          log(error);
          let networkName = getNetworkName(account.chainName);
          Alert.alert(`Failed to link ${networkName} account to FIO address.`);
        }
      } else {
        const res = await fioAddPublicAddress(fioAccount, account, fioFee);
        if (res && res.transaction_id) {
          Alert.alert('Successfully added in tx ' + res.transaction_id);
        } else {
          let error = {
            description: 'Failed _handleConnectAccountToAddress',
            method: 'fioAddPublicAddress',
            location: 'FIOAddressRegistryScreen',
            cause: res,
            fioAccount: fioAccount.address,
            account: account.accountName,
            fioFee: fioFee,
          };
          log(error);
          Alert.alert('Failed to link account to FIO address.');
        }
      }
      setLoading(false);
    } catch (e) {
      Alert.alert(e.message);
      setLoading(false);
    }
  };

  const getNetworkName = (chainName) => {
    let ret = 'Ethereum';
    switch (chainName) {
      case 'ETH':
        ret = 'Ethereum';
        break;
      case 'BNB':
        ret = 'Binance';
        break;
      case 'MATIC':
        ret = 'Polygon';
        break;
      case 'AURORA':
        ret = 'Aurora';
        break;
      default:
        break;
    }

    return ret;
  }

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
      .then(json => setFioFee(json.fee))
      .catch(error =>
        log({
          description: 'getFee - fetch ' + fioEndpoint + '/v1/chain/get_fee',
          cause: error,
          location: 'FIOAddressRegistryScreen',
        }),
      );
  };


  const updateExternalAccounts = (chain, pubkey) => {
    if (pubkey) {
      var address = pubkey;
      var publicKey = pubkey;
      // For EOSIO chains: address,publicKey
      if (pubkey.indexOf(',') > 0) {
        [address, publicKey] = pubkey.split(',');
      }
      var external = true;
      var item = { chainName: chain, address: address, accountName: address };
      accounts.map((value, index, array) => {
        if (chain === 'TLOS' && value.chainName === 'Telos' && address === value.accountName) {
          external = false;
        } else if (chain === value.chainName && address === value.accountName) {
          external = false;
        } else if (chain === value.chainName && address === value.address) {
          external = false;
        } else if (chain === value.chainName && value.chainName === 'ALGO' && value.account != null && address === value.account.addr) {
          external = false;
        }
      });
      //console.log(external, chain, item);
      if (external) {
        addAccountToConnectedList(item, external);
      }
    }
  };

  const loadExternalAccounts = async () => {
    blockchains.map((chain, index, array) => {
      fetch(fioEndpoint + '/v1/chain/get_pub_address', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fio_address: fioAccount.address,
          chain_code: chain,
          token_code: chain,
        }),
      })
        .then(response => response.json())
        .then(json =>
          updateExternalAccounts(chain, json.public_address),
        )
        .catch(error =>
          log({
            description:
              'loadExternalAccounts - fetch ' +
              fioEndpoint +
              '/v1/chain/get_pub_address',
            cause: error,
            location: 'FIOAddressRegistryScreen',
          }),
        );
    });
  };

  const loadFIOAddressRegistrations = fioAccount => {
    if (executionCount > 0) {
      return;
    }
    setExecutionCount(1);
    setLoading(true);
    getFee(fioAccount.address);
    loadExternalAccounts();
    accounts.map((value, index, array) => {
      if (value.chainName !== 'FIO') {
        checkRegPubkey(value);
      }
    });
    setLoading(false);
  };


  const _handlePressAccount = index => {
    const item = connectedAccounts[index];
    var account = null;
    accounts.map((value, index, array) => {
      if (item.chainName === value.chainName && item.address === value.accountName) {
        account = value;
      } else if (item.chainName === value.chainName && item.address === value.address) {
        account = value;
      } else if (item.chainName === value.chainName && value.chainName === 'ALGO' && value.account != null && item.address === value.account.addr) {
        account = value;
      }
    });
    if (account == null) {
      Alert.alert("Could not load matching account!");
      return;
    }
    if (account.chainName === 'FIO') {
      navigate('FIOAddressActions', { account });
    } else if (account.chainName === 'ALGO') {
      navigate('AlgoAccount', { account });
    } else if (account.chainName === 'XLM') {
      navigate('StellarAccount', { account });
    } else if (account.chainName === 'BNB') {
      navigate('BinanceAccount', { account });
    } else if (account.chainName === 'MATIC') {
      navigate('PolygonAccount', { account });
    } else if (account.chainName === 'ETH') {
      navigate('EthereumAccount', { account });
    } else if (account.chainName === 'AURORA') {
      navigate('AuroraAccount', { account });
    }else {
      navigate('AccountDetails', { account });
    }
  };

  const showLoadingIcon = () => {
    if (connectedHeader === '') {
      return (<Image style={styles.loading}
        source={require('../../../assets/icons/loading-icon.gif')}
        resizeMode="contain"
      />);
    }
    return null;
  }

  if (executionCount === 0) {
    loadFIOAddressRegistrations(fioAccount);
  }


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
        <View style={styles.rowContainer}>
          <Image
            source={require('../../../assets/chains/fio.png')}
            style={styles.buttonIcon}
          />
          <KHeader title={fioAccount.address} subTitle={"Registry"} style={styles.top_header} />
        </View>
        <KText> </KText>
        {showLoadingIcon()}
        <KText>{connectedHeader}</KText>
        <FlatList
          data={connectedAccounts}
          keyExtractor={(item, index) => `${index}`}
          renderItem={({ item, index }) => (
            <ChainAddressItem
              account={item}
              style={styles.listItem}
              onPress={() => _handlePressAccount(index)}
            />
          )}
        />
        <KText>{disconnectedHeader}</KText>
        <FlatList
          data={filteredAccounts}
          keyExtractor={(item, index) => `${index}`}
          renderItem={({ item, index }) => (
            <ConnectAddressItem
              account={item}
              style={styles.listItem}
              onPress={() => _handleConnectAccountToAddress(item)}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default connectAccounts()(FIOAddressRegistryScreen);
