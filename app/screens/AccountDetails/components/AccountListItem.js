import React, { useState } from 'react';
import { Image, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import CheckBox from 'react-native-check-box';
import { KText } from '../../../components';
import { log } from '../../../logger/logger';
import web3Module from '../../../ethereum/ethereum';
import { getNativeTokenName } from '../../../external/blockchains';
import {
  PRIMARY_GRAY,
  PRIMARY_BLACK,
  PRIMARY_BLUE,
} from '../../../theme/colors';


const tokenABI = require('../../../ethereum/abi.json');

const { height, width } = Dimensions.get('window');
var chainWidth = width - 90;


const AccountListItem = ({ account, chain, token, onPress, ...props }) => {
  
  const [tokenBalance, setTokenBalance] = useState(0);
  const [count, setCount] = useState(0);
  const { getBalanceOfTokenOfAccount, } = web3Module({
    tokenABI,
    tokenAddress: token.address,
    decimals: token.decimals
  });

  const refreshBalances = async () => {
    const balance = await getBalanceOfTokenOfAccount(chain, account.address);
    const fixedBalance = parseFloat(balance).toFixed(4);
    setTokenBalance(fixedBalance);
    setCount(1);
  };

  const handleOnPress = index => {
    setCount(0);
    refreshBalances();
    onPress(index, chain);
  };

  if (count === 0) {
    refreshBalances();
  }

  const getChainIcon = name => {
    if (name == "BNB") {
      return require("../../../../assets/chains/bsc.png");
    } else if (name == "MATIC") {
      return require("../../../../assets/chains/polygon.png");
    } else if (name == "ETH") {
      return require("../../../../assets/chains/eth.png");
    } else if (name == "AURORA") {
      return require("../../../../assets/chains/aurora.png");
    } else if (name == "TELOSEVM") {
      return require("../../../../assets/chains/telosevm.png");
    } else {
      return "";
    }
  }

  const getAccountTokenBalanceText = () => {
    return " " + account.address.substring(0, 12) + ".., " + tokenBalance + " " + token.symbol;
  }


if(tokenBalance > 0) {
  return (
      <View>
        <View onFocus={refreshBalances} style={styles.rowContainer}>
          <View style={[styles.container, props.style]}>
            <Image source={getChainIcon(chain)} style={styles.chainIcon} />
            <TouchableOpacity onPress={handleOnPress}>
              <KText style={styles.chainName}>
                {getAccountTokenBalanceText()}
              </KText>
            </TouchableOpacity>
            <TouchableOpacity onPress={refreshBalances}>
              <Icon name={'refresh'} size={25} color="#000000" />
            </TouchableOpacity>
          </View>
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
    marginLeft: 10,
  },
  chainName: {
    width: chainWidth,
    fontSize: 16,
    color: PRIMARY_BLACK,
  },
  chainIcon: {
    width: 18,
    height: 18,
  },
  tokenName: {
    fontSize: 15,
    color: PRIMARY_BLUE,
  },
  accountName: {
    fontSize: 16,
    color: PRIMARY_GRAY,
  },
});

export default AccountListItem;
