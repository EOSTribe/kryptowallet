import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { KText } from '../../../components';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAlgoAccountInfo } from '../../../algo/algo';
import {
  PRIMARY_BLACK
} from '../../../theme/colors';

const { height, width } = Dimensions.get('window');
var tokenWidth = width - 90;

const algoDivider = 1000000;


const AlgoCoinBalanceItem = ({
  accounts,
  coinIcon,
  showIfZero,
  onPress,
  ...props
}) => {
  const [coinBalance, setCoinBalance] = useState(0.00);

  const handleOnPress = index => {
    onPress(index);
  };

const loadAlgoAccountBalance = async (account) => {
  try {
    const addr = account.account.addr;
    const info = await getAlgoAccountInfo(addr);
    return (parseFloat(info.amount) / algoDivider).toFixed(4);
  } catch (err) {
    log({
      description: 'loadAlgoAccountBalance',
      cause: err,
      location: 'AccountListItem',
    });
    return 0.0;
  }
};

  const refreshBalances = async () => {
  	var totalBalance = parseFloat(0.00);
  	for (const account of accounts) {
      if(account.chainName === 'ALGO') {
        const accBalance = await loadAlgoAccountBalance(account);
  		totalBalance += parseFloat(accBalance);
      }
    }
    setCoinBalance(totalBalance.toFixed(6));
  };

  useEffect(()=> {
    refreshBalances();
  }, [])

 if(showIfZero || coinBalance > 0) {
  return (
    <View onFocus={refreshBalances} style={styles.rowContainer}>
      <View style={[styles.container, props.style]}>
        <Image source={coinIcon} style={styles.chainIcon} />
        <TouchableOpacity onPress={handleOnPress}>
          <KText style={styles.tokenName}>
             {' '} {coinBalance} {'ALGO'}
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

export default AlgoCoinBalanceItem;
