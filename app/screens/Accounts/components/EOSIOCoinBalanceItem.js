import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { KText } from '../../../components';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getChain } from '../../../eos/chains';
import { getAccount } from '../../../eos/eos';
import {
  PRIMARY_BLACK
} from '../../../theme/colors';

const { height, width } = Dimensions.get('window');
var tokenWidth = width - 90;



const EOSIOCoinBalanceItem = ({
  accounts,
  coinName,
  coinIcon,
  showIfZero,
  onPress,
  ...props
}) => {
  const [coinBalance, setCoinBalance] = useState(0.00);

  const handleOnPress = index => {
    onPress(index);
  };

  const loadAccountBalance = async (account) => {
  const chain = getChain(account.chainName);
  if (!chain) {
    return;
  }
  try {
    const accountInfo = await getAccount(account.accountName, chain);
    // Calculate balance:
    var selfUnstaked = 0;
    if (accountInfo.core_liquid_balance) {
      token = accountInfo.core_liquid_balance.split(' ')[1];
      selfUnstaked = parseFloat(accountInfo.core_liquid_balance.split(' ')[0]);
    }
    // Calculate self stakes:
    var selfCpuStaked = 0;
    var selfNetStaked = 0;
    if (accountInfo.self_delegated_bandwidth) {
      if (accountInfo.self_delegated_bandwidth.cpu_weight) {
        selfCpuStaked = parseFloat(
          accountInfo.self_delegated_bandwidth.cpu_weight.split(' ')[0],
        );
      }
      if (accountInfo.self_delegated_bandwidth.net_weight) {
        selfNetStaked = parseFloat(
          accountInfo.self_delegated_bandwidth.net_weight.split(' ')[0],
        );
      }
    }
    // Calculate refund amount:
    var refund = accountInfo.refund_request;
    var totRefund = 0;
    if (refund) {
      var cpuRefund = refund.cpu_amount
        ? parseFloat(refund.cpu_amount.split(' ')[0])
        : 0;
      var netRefund = refund.net_amount
        ? parseFloat(refund.net_amount.split(' ')[0])
        : 0;
      totRefund = cpuRefund + netRefund;
    }
    var totalBalance = (
      selfUnstaked +
      selfCpuStaked +
      selfNetStaked +
      totRefund
    ).toFixed(4);
    return totalBalance;
  } catch (err) {
    log({
      description: 'loadAccountBalance',
      cause: err,
      location: 'EOSIOCoinBalanceItem',
    });
    return;
  }
};

  const refreshBalances = async () => {
  	var totalBalance = parseFloat(0.00);
  	for (const account of accounts) {
      if(account.chainName === coinName) {
        const accBalance = await loadAccountBalance(account);
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

export default EOSIOCoinBalanceItem;
