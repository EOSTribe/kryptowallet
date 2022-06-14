import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { get } from 'lodash';
import moment from 'moment';
import { KText } from '../../../components';
import { PRIMARY_GRAY } from '../../../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const TransactionItem = ({ item, onPress }) => {
  const getCoin = () => {
    let coin = "?";
    if(item.chain) {
      coin = item.chain;
    } else if(item.sender.chain) {
      coin = item.sender.chain;
    }
    if(coin=="Telos") coin = "TLOS";
    if(coin=="AURORA") coin = "ETH";
    return coin;
  };

  const getSender = () => {
    let sender = "";
    if(item.sender.address) {
      sender = item.sender.address;
    } else if(item.sender.accountName) {
      sender = item.sender.accountName;
    } else {
      sender = item.sender;
    }
    if(sender.length > 16) {
      return sender.substring(0,16) + "..";
    }
    return sender;
  }

  const getReceiver = () => {
    receiver = "";
    if(item.isFioAddress) {
      receiver = item.toFioAddress;
    } else if(item.receiver.address) {
      receiver = item.receiver.address;
    } else if(item.receiver.accountName) {
      receiver = item.receiver.accountName;
    } else {
      receiver = item.receiver;
    }
    if(receiver.length > 16) {
      return receiver.substring(0,16) + "..";
    }
    return receiver;
  }

  return (
      <View style={styles.container}>
        <View style={styles.row}>
          <KText style={styles.date}>
            {moment(item.date).format('MMM DD, YYYY hh:mm:ss A')}
          </KText>
          <KText style={styles.amount}>{item.amount} {getCoin()}</KText>
        </View>
        <View style={styles.secondRow}>
          <KText>{getSender()} {'->'} {getReceiver()}</KText>
          <TouchableOpacity onPress={onPress}>
            <LinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              colors={['#6A63EE', '#59D4FC']}
              style={styles.button}>
              <Icon name={'restore'} style={styles.icon} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.thirdRow}>
          <KText>Memo: {item.memo}</KText>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderColor: '#E5E5EE',
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  thirdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  button: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 10,
    margin: 0,
    padding: 0,
  },
  icon: {
    fontSize: 18,
    color: '#FFF',
  },
  date: {
    fontSize: 12,
  },
  amount: {
    fontSize: 14,
  },
});

export default TransactionItem;
