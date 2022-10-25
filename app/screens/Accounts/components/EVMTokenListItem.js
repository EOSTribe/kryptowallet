import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { KText } from '../../../components';
import Icon from 'react-native-vector-icons/MaterialIcons';
import web3Module from '../../../ethereum/ethereum';
import {
  PRIMARY_BLACK
} from '../../../theme/colors';

const { height, width } = Dimensions.get('window');
var tokenWidth = width - 60;

const tokenABI = require('../../../ethereum/abi/tokenAbi.json');

const EVMTokenListItem = ({
  account,
  token,
  onPress,
  ...props
}) => {
  const [tokenBalance, setTokenBalance] = useState(0);
  const {
    getBalanceOfTokenOfAccount
  } = web3Module();

  const handleOnPress = index => {
    onPress(index);
  };

  const refreshBalances = async () => {
    const balance = await getBalanceOfTokenOfAccount(account.chainName, account.address, token.address, token.decimals);
    setTokenBalance(`${balance} ${token.name}`);
  };

  useEffect(()=> {
    refreshBalances();
  }, [])

  return (
    <View onFocus={refreshBalances} style={styles.rowContainer}>
      <View style={[styles.container, props.style]}>
        <TouchableOpacity onPress={handleOnPress}>
          <KText style={styles.tokenName}>
            {token.symbol}: {tokenBalance}
          </KText>
        </TouchableOpacity>
        <TouchableOpacity onPress={refreshBalances}>
          <Icon name={'refresh'} size={25} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );


};

const styles = StyleSheet.create({
  rowContainer: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowColor: '#2A2240',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    borderRadius: 6,
    elevation: 4,
    backgroundColor: '#F1F6FF',
    padding: 5,
  },
  contentContainer: {
    marginLeft: 20,
  },
  tokenName: {
    width: tokenWidth,
    fontSize: 15,
    color: PRIMARY_BLACK,
  },
  chainIcon: {
    width: 18,
    height: 18,
  },
});

export default EVMTokenListItem;
