import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { KText } from '../../../components';
import Icon from 'react-native-vector-icons/MaterialIcons';
import web3Module from '../../../ethereum/ethereum';
import { getEVMTokenByName } from '../../../ethereum/tokens';
import {
  PRIMARY_BLACK
} from '../../../theme/colors';

const { height, width } = Dimensions.get('window');
var tokenWidth = width - 90;

const tokenABI = require('../../../ethereum/abi.json');

const EVMTokenBalanceItem = ({
  accounts,
  tokenName,
  tokenIcon,
  showIfZero,
  onPress,
  onBalanceUpdate,
  ...props
}) => {
  const [tokenBalance, setTokenBalance] = useState(0.00);

  const handleOnPress = index => {
    onPress(index);
  };

  const refreshBalances = async () => {
  	var totalBalance = 0.00;
  	for (const account of accounts) {
      if(account.chainName == "ETH" || 
         account.chainName == "BNB" || 
         account.chainName == "MATIC" || 
         account.chainName == "AURORA" || 
         account.chainName == "TELOSEVM") {
        const evmToken = getEVMTokenByName(account.chainName, tokenName);
        const { getBalanceOfTokenOfAccount } = web3Module({
          tokenABI,
          tokenAddress: evmToken.address,
          decimals: evmToken.decimals
        });
        if(evmToken) {
      	 const accTokenBalance = await getBalanceOfTokenOfAccount(tokenName, account.address);
          totalBalance += parseFloat(accTokenBalance);
        }
      }
    }
    setTokenBalance(totalBalance);
    onBalanceUpdate(tokenName, totalBalance);
  };

  useEffect(()=> {
    refreshBalances();
  }, [])

 if(showIfZero || tokenBalance > 0) {
  return (
    <View onFocus={refreshBalances} style={styles.rowContainer}>
      <View style={[styles.container, props.style]}>
        <Image source={tokenIcon} style={styles.chainIcon} />
        <TouchableOpacity onPress={handleOnPress}>
          <KText style={styles.tokenName}>
             {' '} {tokenBalance} {tokenName}
          </KText>
        </TouchableOpacity>
        <TouchableOpacity onPress={refreshBalances}>
          <Icon name={'refresh'} size={25} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
 } else {
  return null;
 }


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
    marginLeft: 5,
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

export default EVMTokenBalanceItem;
