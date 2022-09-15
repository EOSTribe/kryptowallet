import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import AccountListItem from './components/AccountListItem';
import {
  KHeader,
  KButton,
  KText,
  KInput,
} from '../../components';
import styles from './AccountDetailsScreen.style';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { log } from '../../logger/logger';
import { getEVMTokenByName } from '../../ethereum/tokens';


const EVMTokenAccountListScreen = props => {

  const {
    navigation: { navigate, goBack },
    route: {
      params: { tokenName: tokenName },
    },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const evmAccounts = accounts.filter((value, index, array) => {  
      return (value.chainName === 'ETH' || value.chainName === 'BNB' || value.chainName === 'MATIC' || value.chainName === 'AURORA' || value.chainName === 'TELOSEVM');
  });


  const _handlePressAccount = (index, chainName) => {
    const account = evmAccounts[index];
    if (account == null) return;
    const token = getEVMTokenByName(chainName, tokenName);
    navigate('ERC20TokenDetails', { account, token, chainName });
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
          <KHeader title={tokenName} style={styles.header} />
          <FlatList
            data={evmAccounts}
            keyExtractor={(item, index) => `${index}`}
            renderItem={({ item, index }) => (
             <View>
              <AccountListItem
                account={item}
                chain={'ETH'}
                token={getEVMTokenByName('ETH', tokenName)}
                style={styles.listItem}
                onPress={() => _handlePressAccount(index, 'ETH')}
              />
              <AccountListItem
                account={item}
                chain={'BNB'}
                token={getEVMTokenByName('BNB', tokenName)}
                style={styles.listItem}
                onPress={() => _handlePressAccount(index, 'BNB')}
              />
              <AccountListItem
                account={item}
                chain={'MATIC'}
                token={getEVMTokenByName('MATIC', tokenName)}
                style={styles.listItem}
                onPress={() => _handlePressAccount(index, 'MATIC')}
              />
              <AccountListItem
                account={item}
                chain={'AURORA'}
                token={getEVMTokenByName('AURORA', tokenName)}
                style={styles.listItem}
                onPress={() => _handlePressAccount(index, 'AURORA')}
              />
             </View>
            )}
          />
        </View>
      </SafeAreaView>
    );
}

export default connectAccounts()(EVMTokenAccountListScreen);
