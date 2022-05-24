import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  KHeader,
  KLabel,
  KButton,
  KInput,
} from '../../components';
import styles from './AccountDetailsScreen.style';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { web3TokenInfoModule } from '../../ethereum/ethereum';

const TOKEN_ADDRESS_LENGTH = 42;

const TokenImportScreen = props => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('');

  const {
    navigation: { navigate, goBack },
    route: {
      params: { account: account },
    },
    addToken,
    accountsState: { tokens },
  } = props;

  const {
    getName,
    getSymbol,
    getDecimals
  } = web3TokenInfoModule();

  const refreshInfo = async () => {
    const name = await getName(account.chainName, tokenAddress);
    setTokenName(name);
    const symbol = await getSymbol(account.chainName, tokenAddress);
    setTokenSymbol(symbol);
    const decimals = await getDecimals(account.chainName, tokenAddress);
    setTokenDecimals(decimals);
  };


  const _handleTokenAddressChange = (value) => {
    if (value.indexOf(' ') >= 0) {
      value = value.trim();
    }

    setTokenAddress(value);
  };

  const _handleImportToken = (event) => {
    event.stopPropagation();
    const index = tokens.findIndex((cell) => cell.chainName === account.chainName && cell.address === tokenAddress);
    if(index >= 0) {
      Alert.alert("Already exist the token!");
      return;
    }
    const item = {
      chainName: account.chainName,
      address: tokenAddress,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
    }

    addToken(item);
    navigate('Tokens', { account });
  }

  useEffect(() => {
    if (tokenAddress && tokenAddress.length === TOKEN_ADDRESS_LENGTH && tokenAddress.substring(0, 2) === '0x') {
      refreshInfo();
    }
    else {
      setTokenName('');
      setTokenSymbol('');
      setTokenDecimals('');
    }
  }, [tokenAddress])

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
        <KHeader
          title='Import Tokens'
          subTitle=''
          style={styles.header}
        />
        <KInput
          label='Token Address'
          placeholder={'Enter new token address'}
          value={tokenAddress}
          onChangeText={_handleTokenAddressChange}
          containerStyle={styles.inputContainer}
          autoCapitalize={'none'}
        />
        <KLabel
          title='Token Name:'
          subTitle={tokenName}
          style={styles.header}
        />
        <KLabel
          title='Token Symbol:'
          subTitle={tokenSymbol}
          style={styles.header}
        />
        <KLabel
          title='Token Decimal:'
          subTitle={tokenDecimals}
          style={styles.header}
        />
        <View style={styles.spacer} />
        <KButton
          title={'Add Custom Token'}
          theme={'blue'}
          style={styles.button}
          onPress={_handleImportToken}
        />
      </View>
    </SafeAreaView>
  );
};

export default connectAccounts()(TokenImportScreen);
