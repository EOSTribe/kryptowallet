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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AccountListItem from './components/AccountListItem';
import EVMTokenListItem from './components/EVMTokenListItem';
import EVMTokenBalanceItem from './components/EVMTokenBalanceItem';
import EVMCoinBalanceItem from './components/EVMCoinBalanceItem';
import EOSIOCoinBalanceItem from './components/EOSIOCoinBalanceItem';
import AlgoCoinBalanceItem from './components/AlgoCoinBalanceItem';
import StellarCoinBalanceItem from './components/StellarCoinBalanceItem';
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
  const [showAccounts, setShowAccounts] = useState(1);

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

  const _handlePressERC20Token = tokenName => {
    navigate("EVMTokenAccountList", { tokenName })
  };

  const _handlePressEVMCoin = name => {
    const chainAccount = validAccounts.filter((value, index, array) => {  
      return (value.chainName === name);
    });
    const evmAccounts = validAccounts.filter((value, index, array) => {  
      return (value.chainName === 'ETH' || value.chainName === 'BNB' || value.chainName === 'MATIC' || value.chainName === 'AURORA' || value.chainName === 'TELOSEVM');
    });
    const account = (chainAccount.length > 0) ? chainAccount[0] : evmAccounts[0];
    if (name === 'ETH') {
      navigate('EthereumAccount', { account });
    } else if (name === 'BNB') {
      navigate('BinanceAccount', { account });
    } else if (name === 'MATIC') {
      navigate('PolygonAccount', { account });
    } else if (name === 'AURORA') {
      navigate('AuroraAccount', { account });
    } else if (name === 'TELOSEVM') {
      navigate('TelosEVMAccount', { account });
    } else {
      Alert.alert("Unknown token " + name);
    }
  };

  const _handlePressEOSIOCoin = name => {
    const chainAccount = validAccounts.filter((value, index, array) => {  
      return (value.chainName === name);
    });
    if(chainAccount.length > 0) {
      const account = chainAccount[0];
      navigate('AccountDetails', { account });
    } else {
      Alert.alert(name + " Account not found!");
    }
  };

  const _handlePressAlgoCoin = () => {
    const chainAccount = validAccounts.filter((value, index, array) => {  
      return (value.chainName === 'ALGO');
    });
    if(chainAccount.length > 0) {
      const account = chainAccount[0];
      navigate('AlgoAccount', { account });
    } else {
      Alert.alert(name + " Account not found!");
    }
  };

  const updateTotal = () => {
    var newTotal = 0;
    for (const elem of totals) {
      if (elem.account && elem.account.indexOf(":") > 0) {
        let chainAccount = elem.account.split(":");
        if(chainAccount[0] === "usd") {
          newTotal += parseFloat(elem.total);
        } else {
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
    }
    setUsdTotal(newTotal.toFixed(2));
  };

  const _handleBalanceUpdate = async (account, balance, chainName) => {
    var prices = await getNativeTokenLatestPrices();
    let chain = (chainName) ? chainName : account.chainName;
    if (chain === "Telos") { chain = "TLOS"; }
    let price = prices[chain];
    let usdval = (price !== null) ? (price * balance).toFixed(2) : 0.0;
    let name = (chain === 'FIO' || chain === 'XLM' || chain === 'ETH' || chain === 'BNB' || chain === 'MATIC' || chain === 'AURORA' || chain === 'TELOSEVM') ? account.address : account.accountName;
    let record = {
      "account": chain + ":" + name,
      "total": usdval
    };
    console.log(record);
    setTotal(record);
    updateTotal();
  };

  const _handleUSDBalanceUpdate = async (usdName, usdBalance) => {
    let usdval = usdBalance.toFixed(2);
    let record = {
      "account": "usd:" + usdName,
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


  if (runCount == 0 && validAccounts.length > 0) {
    setRunCount(1);
    checkOnLatestVersion();
    addKeysIfMissing();
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

if(showAccounts) {
  return (
    <SafeAreaView style={styles.container}>
      <SafeAreaView style={styles.mainContainer}>
        <SafeAreaView style={styles.accountContainer}>
          {nftShowStatus ?
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
            :
            <View style={styles.logoContainer}>
              <Image
                style={styles.logo}
                source={tribeLogoURL}
                resizeMode="contain"
              />
            </View>
          }
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
          <KButton
            title={'Balances'}
            style={styles.button}
            onPress={() => setShowAccounts(0)}
          />
        </SafeAreaView>
      </SafeAreaView>
      <Text style={styles.version}>{getAppVersion()}</Text>
    </SafeAreaView>
  );
} else {
  return (
    <SafeAreaView style={styles.container}>
      <SafeAreaView style={styles.mainContainer}>
        <SafeAreaView style={styles.accountContainer}>
          {nftShowStatus ?
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
            :
            <View style={styles.logoContainer}>
              <Image
                style={styles.logo}
                source={tribeLogoURL}
                resizeMode="contain"
              />
            </View>
          }
          {showUsdTotal()}
          <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <EVMTokenBalanceItem
                accounts={validAccounts}
                tokenName={'USDT'}
                showIfZero={true}
                tokenIcon={require("../../../assets/tokens/tether-icon.png")}
                style={styles.listItem}
                onPress={() => _handlePressERC20Token('USDT')}
                onBalanceUpdate={_handleUSDBalanceUpdate}
              />
          <EVMTokenBalanceItem
                accounts={validAccounts}
                tokenName={'USDC'}
                showIfZero={false}
                tokenIcon={require("../../../assets/tokens/usdc-icon.png")}
                style={styles.listItem}
                onPress={() => _handlePressERC20Token('USDC')}
                onBalanceUpdate={_handleUSDBalanceUpdate}
              /> 
          <EVMTokenBalanceItem
                accounts={validAccounts}
                tokenName={'BUSD'}
                showIfZero={false}
                tokenIcon={require("../../../assets/tokens/busd-icon.png")}
                style={styles.listItem}
                onPress={() => _handlePressERC20Token('BUSD')}
                onBalanceUpdate={_handleUSDBalanceUpdate}
              />
          <EVMCoinBalanceItem
                accounts={validAccounts}
                coinName={'ETH'}
                showIfZero={false}
                coinIcon={require("../../../assets/chains/eth.png")}
                style={styles.listItem}
                onPress={() => _handlePressEVMCoin('ETH')}
              />   
          <EVMCoinBalanceItem
                accounts={validAccounts}
                coinName={'BNB'}
                showIfZero={false}
                coinIcon={require("../../../assets/chains/bsc.png")}
                style={styles.listItem}
                onPress={() => _handlePressEVMCoin('BNB')}
              /> 
          <EVMCoinBalanceItem
                accounts={validAccounts}
                coinName={'MATIC'}
                showIfZero={false}
                coinIcon={require("../../../assets/chains/polygon.png")}
                style={styles.listItem}
                onPress={() => _handlePressEVMCoin('MATIC')}
              />   
          <EVMCoinBalanceItem
                accounts={validAccounts}
                coinName={'AURORA'}
                showIfZero={false}
                coinIcon={require("../../../assets/chains/aurora.png")}
                style={styles.listItem}
                onPress={() => _handlePressEVMCoin('AURORA')}
              /> 
          <EVMCoinBalanceItem
                accounts={validAccounts}
                coinName={'TELOSEVM'}
                showIfZero={false}
                coinIcon={require("../../../assets/chains/telosevm.png")}
                style={styles.listItem}
                onPress={() => _handlePressEVMCoin('TELOSEVM')}
              />    
          <EOSIOCoinBalanceItem
                accounts={validAccounts}
                coinName={'EOS'}
                showIfZero={false}
                coinIcon={require("../../../assets/chains/eos.png")}
                style={styles.listItem}
                onPress={() => _handlePressEOSIOCoin('EOS')}
              />      
          <EOSIOCoinBalanceItem
                accounts={validAccounts}
                coinName={'Telos'}
                showIfZero={false}
                coinIcon={require("../../../assets/chains/telos.png")}
                style={styles.listItem}
                onPress={() => _handlePressEOSIOCoin('Telos')}
              /> 
          <AlgoCoinBalanceItem
                accounts={validAccounts}
                showIfZero={false}
                coinIcon={require("../../../assets/chains/algo.png")}
                style={styles.listItem}
                onPress={() => _handlePressAlgoCoin()}
              />   
          <StellarCoinBalanceItem
                accounts={validAccounts}
                showIfZero={true}
                coinIcon={require("../../../assets/chains/xlm.png")}
                style={styles.listItem}
                onPress={() => _handlePressStellarCoin()}
              />     
          </KeyboardAwareScrollView>              
          <FlatList/>
          <KButton
            title={'Accounts'}
            style={styles.button}
            onPress={() => setShowAccounts(1)}
          />
        </SafeAreaView>
      </SafeAreaView>
      <Text style={styles.version}>{getAppVersion()}</Text>
    </SafeAreaView>
  );
}


};

export default connectAccounts()(AccountsScreen);
