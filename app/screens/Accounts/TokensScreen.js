import React, { useEffect, useState } from 'react';
import DeviceInfo from 'react-native-device-info';
import {
  Image,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KButton, KHeader, KText } from '../../components';
import styles from './AccountsScreen.style';
import { connectAccounts } from '../../redux';
import TokenListItem from './components/TokenListItem';
import EVMTokenListItem from './components/EVMTokenListItem';
import { getTokens } from '../../eos/tokens';
import { getEVMTokens } from '../../ethereum/tokens';
import { PRIMARY_BLUE } from '../../theme/colors';

const getTokenList = chainName => {
  let tokenList;
  if (chainName === 'ETH' || chainName === 'BNB' || chainName === 'MATIC' || chainName === 'AURORA' || chainName === 'TELOSEVM') {
    tokenList = getEVMTokens(chainName);
  }
  else {
    tokenList = getTokens(chainName);
  }

  return tokenList;
}


const TokensScreen = props => {
  const {
    navigation: { navigate, goBack },
    route: {
      params: { account: account },
    },
    accountsState: { accounts, addresses, keys, totals, history, config, tokens },
  } = props;

  const [tokenList, setTokenList] = useState([]);

  useEffect(() => {
    let list = getTokenList(account.chainName);
    const addedList = tokens.filter((cell) => cell.chainName === account.chainName);
    addedList.forEach(element => {
      list.push(element);
    });
    setTokenList(list);
  }, [tokens])

  const _handlePressToken = index => {
    let token = tokenList[index];
    navigate('TokenDetails', { account, token });
  };

  const _handlePressERC20Token = index => {
    let token = tokenList[index];
    let chainName = account.chainName;
    navigate('ERC20TokenDetails', { account, token, chainName });
  };

  const getTitle = () => {
    let title;
    if (account.chainName === 'ETH' || account.chainName === 'BNB' || account.chainName === 'MATIC' || account.chainName === 'AURORA' || account.chainName === 'TELOSEVM') {
      title = account.chainName + ' tokens';
    }
    else {
      title = account.chainName + ':' + account.accountName + ' tokens';
    }

    return title;
  };

  const handleAddToken = () => {
    navigate('TokenImport', { account });
  };

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
        <KHeader title={getTitle()} style={styles.header} />
        <FlatList
          data={tokenList}
          keyExtractor={(item, index) => `${index}`}
          renderItem={({ item, index }) => (
            account.chainName === 'ETH' || account.chainName === 'BNB' || account.chainName === 'MATIC' || account.chainName === 'AURORA' || account.chainName === 'TELOSEVM' ?
              <EVMTokenListItem
                account={account}
                token={item}
                style={styles.listItem}
                onPress={() => _handlePressERC20Token(index)}
              />
              :
              <TokenListItem
                account={account}
                token={item}
                style={styles.listItem}
                onPress={() => _handlePressToken(index)}
                showAllTokens={config.showAllTokens}
              />
          )}
        />
        {account.chainName === 'ETH' || account.chainName === 'BNB' || account.chainName === 'MATIC' || account.chainName === 'AURORA' || account.chainName === 'TELOSEVM' ?
          <TouchableOpacity onPress={handleAddToken}>
            <View style={[styles.addContainer, props.style]}>
              <View style={styles.contentContainer}>
                <KText style={styles.tokenName}> + Import Tokens</KText>
              </View>
            </View>
          </TouchableOpacity>
          : null
        }
      </View>
    </SafeAreaView>
  );
};

export default connectAccounts()(TokensScreen);
