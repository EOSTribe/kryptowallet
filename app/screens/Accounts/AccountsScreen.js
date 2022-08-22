import React, { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';
import {
  View,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Linking,
  Text,
  Alert,
} from 'react-native';
import { KButton, KText, AccountButtons, ChainButtons, } from '../../components';
import styles from './AccountsScreen.style';
import { connectAccounts } from '../../redux';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import ecc from 'eosjs-ecc-rn';
import algosdk from 'algosdk';
import { createKeyPair } from '../../stellar/stellar';
import Wallet from 'ethereumjs-wallet';
import AccountListItem from './components/AccountListItem';
import { getEndpoint } from '../../eos/chains';
import { getNativeTokenLatestPrices } from '../../pricing/coinmarketcap';
import { log } from '../../logger/logger';
import { web3NFTModule } from '../../ethereum/ethereum';
import { isEVMNetwork } from '../../external/blockchains';

const nonNFTURL = require('../../../assets/nft/not-revealed.png');
const tribeLogoURL = require('../../../assets/logo/tribe-logo.png');

const AccountsScreen = props => {
  const {
    connectAccount,
    deleteAccount,
    addKey,
    setTotal,
    navigation: { navigate },
    accountsState: { accounts, addresses, keys, totals, history, config, nftTokens, nftShowStatus },
  } = props;

  const {
    getNFTImageURL,
  } = web3NFTModule();

  const [nftAvatar, setNftAvatar] = useState(nonNFTURL);
  const fioEndpoint = getEndpoint('FIO');

  const [validAccounts, setValidAccounts] = useState([]);
  const [runCount, setRunCount] = useState(0);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [usdTotal, setUsdTotal] = useState(0.0);

  const [isListChainsVisible, setListChainsVisible] = useState(false);

  const toggleListChains = () => {
    setListChainsVisible(!isListChainsVisible);
  };

  
  useEffect(() => {
    const valids = accounts.filter((value, index, array) => {
      return (value != null);
    });
    setValidAccounts(valids)

    // Make sure empty account records removed:
    accounts.map((value, index, array) => {
      if (!value) {
        console.log("Delete account #" + index);
        deleteAccount(index);
      }
    });
    
  }, [accounts])


  useEffect(() => {
    const parseInfo = async () => {
      const index = nftTokens.findIndex(cell => cell.isSelected);
      const tokenId = index !== -1 ? nftTokens[index].tokenId : nftTokens[0].tokenId;
      const avatarURL = await getNFTImageURL(tokenId);
      setNftAvatar(avatarURL);
    }

    if (nftTokens && nftTokens.length > 0 && nftShowStatus) {
      parseInfo();
    }
  }, [nftTokens, nftShowStatus])


  const _handlePressAccount = index => {
    const account = validAccounts[index];
    if (account == null) return;
    if (account.chainName === 'FIO') {
      navigate('FIOAddressActions', { account });
    } else if (account.chainName === 'ALGO') {
      navigate('AlgoAccount', { account });
    } else if (account.chainName === 'XLM') {
      navigate('StellarAccount', { account });
    } else if (account.chainName === 'ETH') {
      navigate('EthereumAccount', { account });
    } else if (account.chainName === 'BNB') {
      navigate('BinanceAccount', { account });
    } else if (account.chainName === 'MATIC') {
      navigate('PolygonAccount', { account });
    } else if (account.chainName === 'AURORA') {
      navigate('AuroraAccount', { account });
    } else if (account.chainName === 'TELOSEVM') {
      navigate('TelosEVMAccount', { account });
    } else {
      navigate('AccountDetails', { account });
    }
  };

  const _handlePressTokenList = index => {
    const account = validAccounts[index];
    navigate('Tokens', { account });
  };

  const updateTotal = () => {
    var newTotal = 0;
    for (const elem of totals) {
      if (elem.account && elem.account.indexOf(":") > 0) {
        let chainAccount = elem.account.split(":");
        const matchingAccounts = validAccounts.filter((value, index, array) => {
          let accName = (value.address) ? value.address : value.accountName;
          return (value.chainName === chainAccount[0] && accName === chainAccount[1]);
        });
        if (matchingAccounts.length > 0) {
          try {
            newTotal += parseFloat(elem.total)
          } catch (err) {
            console.log(err);
          }
        }
      }
    }
    setUsdTotal(newTotal.toFixed(2));
  };

  const _handleBalanceUpdate = async (account, balance) => {
    var prices = await getNativeTokenLatestPrices();
    let chain = (account.chainName === "Telos") ? "TLOS" : account.chainName;
    let price = prices[chain];
    let usdval = (price !== null) ? (price * balance).toFixed(2) : 0.0;
    let name = (chain === 'FIO' || chain === 'XLM' || chain === 'ETH' || chain === 'BNB' || chain === 'MATIC' || chain === 'AURORA' || chain === 'TELOSEVM') ? account.address : account.accountName;
    let record = {
      "account": chain + ":" + name,
      "total": usdval
    };
    setTotal(record);
    updateTotal();
  };

  const getAppVersion = () => {
    return (
      'Version ' +
      DeviceInfo.getVersion() +
      ', Build ' +
      DeviceInfo.getBuildNumber()
    );
  };

  const goToAppStore = () => {
    Linking.openURL('https://apps.apple.com/us/app/id1521532252');
  };

  const goToPlayStore = () => {
    Linking.openURL(
      'https://play.google.com/store/apps/details?id=com.kryptowallet',
    );
  };

  const parseIOSVersion = html => {
    let pattern = 'data-test-version-number>Version ';
    let index = html.indexOf(pattern);
    if (index > 0) {
      let startPos = index + pattern.length;
      let endPos = startPos + 3;
      var version = html.substring(startPos, endPos);
      let appVersion = DeviceInfo.getVersion();
      console.log('App Store Version ' + version + ' vs. App Version ' + appVersion);

      if (appVersion !== version) {
        Alert.alert(
          'New version available!',
          'Download latest version ' +
          version +
          ' of TRIBE Wallet from App Store.',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('Update wallet cancelled'),
              style: 'cancel',
            },
            { text: 'OK', onPress: () => goToAppStore() },
          ],
          { cancelable: true },
        );
      }
    }
  };

  const checkLatestIOSVersion = () => {
    let storeUrl = 'https://apps.apple.com/us/app/id1521532252';
    try {
      fetch(storeUrl, { method: 'GET' })
        .then(response => response.text())
        .then(text => parseIOSVersion(text))
        .catch(error =>
          log({
            description: 'checkLatestIOSVersion - fetch ' + storeUrl,
            cause: error,
            location: 'AccountsScreen',
          }),
        );
    } catch (err) {
      log({
        description: 'checkLatestIOSVersion',
        cause: err,
        location: 'AccountsScreen',
      });
    }
  };

  const parseAndroidVersion = html => {
    let pattern = 'Current Version</div>';
    let index = html.indexOf(pattern);
    if (index > 0) {
      let startPos = index + pattern.length;
      var secondHalf = html.substring(startPos);
      let endPos = secondHalf.indexOf('</span>');
      startPos = endPos - 4;
      let version = secondHalf.substring(startPos, endPos);
      let appVersion = DeviceInfo.getVersion();
      let versionFloat = 0.0;
      let appVersionFloat = 0.0;
      console.log(
        'Play Store Version ' + version + ' vs. App Version ' + appVersion,
      );
      try {
        versionFloat = parseFloat(version);
        appVersionFloat = parseFloat(appVersion);
      } catch (err) {
        console.log('Failed to parse float versions', err);
      }
      if (versionFloat > appVersionFloat) {
        Alert.alert(
          'New version available!',
          'Download latest version ' +
          version +
          ' of TRIBE Wallet from Play Store.',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('Update wallet cancelled'),
              style: 'cancel',
            },
            { text: 'OK', onPress: () => goToPlayStore() },
          ],
          { cancelable: true },
        );
      }
    }
  };

  const checkLatestAndroidVersion = () => {
    let storeUrl =
      'https://play.google.com/store/apps/details?id=com.kryptowallet';
    try {
      fetch(storeUrl, { method: 'GET' })
        .then(response => response.text())
        .then(text => parseAndroidVersion(text))
        .catch(error =>
          log({
            description: 'checkLatestAndroidVersion - fetch ' + storeUrl,
            cause: error,
            location: 'AccountsScreen',
          }),
        );
    } catch (err) {
      log({
        description: 'checkLatestAndroidVersion',
        cause: err,
        location: 'AccountsScreen',
      });
    }
  };

  const checkOnLatestVersion = () => {
    let brand = DeviceInfo.getBrand();
    //console.log("Device brand: "+brand);
    if (brand == 'Apple') {
      // Either iPhone device
      checkLatestIOSVersion();
    } else {
      // otherwise - Android
      checkLatestAndroidVersion();
    }
  };

  const addKeysIfMissing = () => {
    validAccounts.map(function (account) {
      if (account.chainName === 'EOS' || account.chainName === 'Telos') {
        const privateKey = account.privateKey;
        const publicKey = ecc.privateToPublic(account.privateKey);
        const foundKeys = keys.filter((value, index, array) => {
          return value.public === publicKey;
        });
        if (foundKeys.length == 0) {
          addKey({ private: privateKey, public: publicKey });
        }
      } else if (account.chainName === 'FIO') {
        const privateKey = account.privateKey;
        const publicKey = Ecc.privateToPublic(account.privateKey);
        const foundKeys = keys.filter((value, index, array) => {
          return value.public === publicKey;
        });
        if (foundKeys.length == 0) {
          addKey({ private: privateKey, public: publicKey });
        }
      } else if (account.chainName === 'XLM') {
        const privateKey = account.privateKey;
        const publicKey = account.address;
        const foundKeys = keys.filter((value, index, array) => {
          return value.public === publicKey;
        });
        if (foundKeys.length == 0) {
          addKey({ private: privateKey, public: publicKey });
        }
      } else if (account.chainName === 'ALGO') {
        const publicKey = account.account.addr;
        const privateKey = account.mnemonic;
        const foundKeys = keys.filter((value, index, array) => {
          return value.public === publicKey;
        });
        if (foundKeys.length == 0) {
          addKey({ private: privateKey, public: publicKey });
        }
      } else if (account.chainName === 'ETH' || account.chainName === 'BNB' || account.chainName === 'MATIC' || account.chainName === 'AURORA' || account.chainName === 'TELOSEVM') {
        const privateKey = account.privateKey;
        const publicKey = account.publicKey;
        const foundKeys = keys.filter((value, index, array) => {
          return value.public === publicKey;
        });
        if (foundKeys.length == 0) {
          addKey({ private: privateKey, public: publicKey });
        }
      }
    });
  };

  const _handleMenu = () => {
    navigate('Menu');
  }

  const _handleImportAccount = () => {
    navigate('ConnectAccount');
  };

  const _handleExportAllKeys = () => {
    navigate('BackupAllKeys');
  };

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

  if (runCount == 0 && validAccounts.length > 0) {
    setRunCount(1);
    checkOnLatestVersion();
    addKeysIfMissing();
  }


  const _handleNewChainPress = (name) => {
    try {

      if (isEVMNetwork(name)) {
        _handleCreateEthereumAccount(name);
      } else if (name == "TLOS") {
        navigate('CreateTelosAccount');
      } else if (name == "FIO") {
        navigate('RegisterFIOAddress');
      } else if (name == "ALGO") {
        _handleCreateAlgorandAccount();
      } else if (name == "XLM") {
        _handleCreateStellarAccount();
      } else {
        Alert.alert("Unknown " + name + " chain!");
      }
    } catch (error) {
      console.log(">>>>>>error:", error)
    }

  }

  const _handleAvatarPress = () => {
    navigate('NFTListScreen');
  }

  const showUsdTotal = () => {
    if (validAccounts.length > 0) {
      return (<Text style={styles.total}>${usdTotal}</Text>);
    }
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <SafeAreaView style={styles.mainContainer}>
        <SafeAreaView style={styles.networkContainer}>
          {isListChainsVisible ?
            <ChainButtons
              onChainPress={_handleNewChainPress}
              onClosePress={toggleListChains}
              closeIcon={() => (
                <Image
                  source={require('../../../assets/icons/minus.png')}
                  style={styles.buttonIcon}
                />
              )}
              telosevmIcon={() => (
                <Image
                  source={require('../../../assets/chains/telosevm.png')}
                  style={styles.buttonIcon}
                />
              )}
              auroraIcon={() => (
                <Image
                  source={require('../../../assets/chains/aurora.png')}
                  style={styles.buttonIcon}
                />
              )}
              polygonIcon={() => (
                <Image
                  source={require('../../../assets/chains/polygon.png')}
                  style={styles.buttonIcon}
                />
              )}
              bscIcon={() => (
                <Image
                  source={require('../../../assets/chains/bsc.png')}
                  style={styles.buttonIcon}
                />
              )}
              ethIcon={() => (
                <Image
                  source={require('../../../assets/chains/eth.png')}
                  style={styles.buttonIcon}
                />
              )}
              fioIcon={() => (
                <Image
                  source={require('../../../assets/chains/fio.png')}
                  style={styles.buttonIcon}
                />
              )}
              telosIcon={() => (
                <Image
                  source={require('../../../assets/chains/telos.png')}
                  style={styles.buttonIcon}
                />
              )}
              algoIcon={() => (
                <Image
                  source={require('../../../assets/chains/algo.png')}
                  style={styles.buttonIcon}
                />
              )}
              xlmIcon={() => (
                <Image
                  source={require('../../../assets/chains/xlm.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
            :
            <AccountButtons
              onMenuPress={_handleMenu}
              onAddPress={toggleListChains}
              onImportPress={_handleImportAccount}
              onExportPress={_handleExportAllKeys}
              menuIcon={() => (
                <Image
                  source={require('../../../assets/icons/menu1.png')}
                  style={styles.buttonIcon}
                />
              )}
              addIcon={() => (
                <Image
                  source={require('../../../assets/icons/add.png')}
                  style={styles.buttonIcon}
                />
              )}
              importIcon={() => (
                <Image
                  source={require('../../../assets/icons/import_key.png')}
                  style={styles.buttonIcon}
                />
              )}
              exportIcon={() => (
                <Image
                  source={require('../../../assets/icons/export_key.png')}
                  style={styles.buttonIcon}
                />
              )}
              nftShowStatus={nftShowStatus}
            />
          }
        </SafeAreaView>
        <SafeAreaView style={styles.accountContainer}>
          {/* {nftShowStatus ? */}
            <TouchableOpacity onPress={_handleAvatarPress}>
              <View style={styles.logoContainer}>
                <Image
                  style={styles.noAvatar}
                  source={nonNFTURL}
                  resizeMode="contain"
                />
                <Image
                  style={styles.nftAvatar}
                  source={nftAvatar}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            {/* :
            <View style={styles.logoContainer}>
              <Image
                style={styles.logo}
                source={tribeLogoURL}
                resizeMode="contain"
              />
            </View>
          } */}
          {showUsdTotal()}
          <FlatList
            data={validAccounts}
            keyExtractor={(item, index) => `${index}`}
            renderItem={({ item, index }) => (
              <AccountListItem
                account={item}
                style={styles.listItem}
                onPress={() => _handlePressAccount(index)}
                onTokenPress={() => _handlePressTokenList(index)}
                onBalanceUpdate={_handleBalanceUpdate}
              />
            )}
          />
        </SafeAreaView>
      </SafeAreaView>
      <Text style={styles.version}>{getAppVersion()}</Text>
    </SafeAreaView>
  );
};

export default connectAccounts()(AccountsScreen);
