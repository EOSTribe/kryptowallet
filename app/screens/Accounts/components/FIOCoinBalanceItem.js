import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { KText } from '../../../components';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getChain, getEndpoint } from '../../../eos/chains';
import { getAccount } from '../../../eos/eos';
import {
  PRIMARY_BLACK
} from '../../../theme/colors';

const { height, width } = Dimensions.get('window');
var tokenWidth = width - 90;

const fioDivider = 1000000000;
const fioEndpoint = getEndpoint('FIO');


const FIOCoinBalanceItem = ({
  accounts,
  coinName,
  coinIcon,
  showIfZero,
  onPress,
  ...props
}) => {
  const [coinBalance, setCoinBalance] = useState(0.00);

  let accountBalanceMap = [];

  const handleOnPress = index => {
    onPress(index);
  };

const loadFioAccountBalance = async (account) => {
  try {
    const pubkey = Ecc.privateToPublic(account.privateKey);
    fetch(fioEndpoint + '/v1/chain/get_fio_balance', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_public_key: pubkey,
      }),
    })
      .then(response => response.json())
      .then(json => {
        const balance = (json.balance !== undefined) ? (parseFloat(json.balance) / fioDivider).toFixed(4) : 0;
        setCoinBalance(balance);
      })
      .catch(error =>
        log({
          description:
            'loadFioAccountBalance - fetch ' +
            fioEndpoint +
            '/v1/chain/get_fio_balance',
          cause: error,
          location: 'AccountListItem',
        }),
      );
  } catch (err) {
    log({
      description: 'loadFioAccountBalance',
      cause: err,
      location: 'AccountListItem',
    });
    return;
  }
};

  const refreshBalances = async () => {
  	var totalBalance = parseFloat(0.00);
  	for (const account of accounts) {
      if(account.chainName === coinName) {
        await loadFioAccountBalance(account);
      }
    }
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
             {' '} {coinBalance} {coinName}
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

export default FIOCoinBalanceItem;
