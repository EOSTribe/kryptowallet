import React, { useState } from 'react';
import { Image, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { KText } from '../../../components';
import { getChain } from '../../../eos/chains';
import { log } from '../../../logger/logger';
import {
  PRIMARY_GRAY,
  PRIMARY_BLACK,
  PRIMARY_BLUE,
} from '../../../theme/colors';


const { height, width } = Dimensions.get('window');
var chainWidth = width - 80;


const ChainAddressItem = ({ account, onPress, ...props }) => {
  const [count, setCount] = useState(0);

  const handleOnPress = index => {
    setCount(0);
    onPress(index);
  };

  const getChainIcon = name => {
    if(name == "BNB") {
      return require("../../../../assets/chains/bsc.png");
    } else if(name == "MATIC") {
      return require("../../../../assets/chains/polygon.png");
    } else if(name == "ETH") {
      return require("../../../../assets/chains/eth.png");
    } else if (name == "AURORA") {
      return require("../../../../assets/chains/aurora.png");
    } else if(name == "EOS") {
      return require("../../../../assets/chains/eos.png");
    } else if(name == "Telos" || name == "TLOS") {
      return require("../../../../assets/chains/telos.png");
    } else if (name == "ALGO") {
      return require("../../../../assets/chains/algo.png");
    } else if (name == "FIO") {
      return require("../../../../assets/chains/fio.png");
    } else if (name == "XLM") {
      return require("../../../../assets/chains/xlm.png");
    } else {
      return "";
    }
  }

  const getFormattedAddress = (address) => {
    if(address && address.length > 30) {
      return " " + address.substring(0,28) + "..";
    } else {
      return " " + address;
    }
  }

  if (!account.external) {
    return (
      <View style={styles.rowContainer}>
        <View style={[styles.container, props.style]}>
          <Image source={getChainIcon(account.chainName)} style={styles.chainIcon}/>
          <TouchableOpacity onPress={handleOnPress}>
            <KText style={styles.onPress}>
              {getFormattedAddress(account.address)}
            </KText>
          </TouchableOpacity>
        </View>
      </View>
    );
  } else {
    return (
      <View style={styles.rowContainer}>
        <View style={[styles.container, props.style]}>
        <Image source={getChainIcon(account.chainName)} style={styles.chainIcon}/>
            <KText style={styles.offPress}>
              {getFormattedAddress(account.address)}
            </KText>
        </View>
      </View>
    );
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
    marginLeft: 20,
  },
  onPress: {
    width: chainWidth,
    fontSize: 14,
    color: PRIMARY_BLUE,
  },
  offPress: {
    width: chainWidth,
    fontSize: 14,
    color: PRIMARY_GRAY,
  },
  chainIcon: {
    width: 18,
    height: 18,
  },
});

export default ChainAddressItem;
