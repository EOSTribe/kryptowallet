import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { KText } from '../../../components';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getBalance } from '../../../eos/tokens';
import { log } from '../../../logger/logger';
import {
  PRIMARY_GRAY,
  PRIMARY_BLACK,
  PRIMARY_BLUE,
} from '../../../theme/colors';

const { height, width } = Dimensions.get('window');
var tokenWidth = width - 60;

const TokenListItem = ({
  account,
  token,
  onPress,
  showAllTokens,
  ...props
}) => {
  const [tokenBalance, setTokenBalance] = useState(0);

  const handleTokenBalance = jsonArray => {
    if (jsonArray && jsonArray.length > 0) {
      setTokenBalance(jsonArray[0]);
    } else {
      setTokenBalance('0 ' + token.name);
    }
  };

  const handleOnPress = index => {
    onPress(index);
  };

  const refreshBalances = () => {
    getBalance(account.accountName, token, handleTokenBalance);
  };

  useEffect(()=> {
    refreshBalances();
  }, [])

  return (
    <View onFocus={refreshBalances} style={styles.rowContainer}>
      <View style={[styles.container, props.style]}>
        <TouchableOpacity onPress={handleOnPress}>
          <KText style={styles.tokenName}>
            {token.name}: {tokenBalance}
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
});

export default TokenListItem;
