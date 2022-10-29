import React, { useState, useEffect } from 'react';
import {
  Image,
  SafeAreaView,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import ecc from 'eosjs-ecc-rn';
import { fioAddExternalAddress } from '../../eos/fio';
import styles from './FIORequestSend.style';
import { KHeader, KButton, KInput, KSelect, KText } from '../../components';
import { connectAccounts } from '../../redux';
import { getAccount } from '../../eos/eos';
import { getEndpoint } from '../../eos/chains';
import { PRIMARY_BLUE } from '../../theme/colors';

const FIORegisterExternalScreen = props => {
  const [fioAccount, setFioAccount] = useState();
  const [chain, setChain] = useState();
  const [token, setToken] = useState();
  const [publicKey, setPublicKey] = useState();
  const [fee, setFee] = useState(0);
  const {
    navigation: { navigate, goBack },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const fioEndpoint = getEndpoint('FIO');

  const fioAccounts = accounts.filter((value, index, array) => {
    return value.chainName == 'FIO';
  });

  const _handleFIOAddressChange = value => {
    setFioAccount(value);
    getFee(value.address);
  };

  const getFee = async address => {
    fetch(fioEndpoint + '/v1/chain/get_fee', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        end_point: 'add_pub_address',
        fio_address: address,
      }),
    })
      .then(response => response.json())
      .then(json => setFee(json.fee))
      .catch(error => console.error(error));
  };

  const _handleSubmit = async () => {
    try {
      const res = await fioAddExternalAddress(
        fioAccount,
        chain,
        token,
        publicKey,
        fee,
      );
      Alert.alert('Successfully added!');
    } catch (e) {
      Alert.alert(e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContentContainer}
        enableOnAndroid>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <MaterialIcon
              name={'keyboard-backspace'}
              size={24}
              color={PRIMARY_BLUE}
            />
          </TouchableOpacity>
          <KHeader
            title={'FIO Register External Account'}
            subTitle={'Connect any crypto account to FIO address'}
            style={styles.header}
          />
          <KSelect
            label={'FIO address'}
            items={fioAccounts.map(item => ({
              label: `${item.chainName}: ${item.address}`,
              value: item,
            }))}
            onValueChange={_handleFIOAddressChange}
            containerStyle={styles.inputContainer}
          />
          <KInput
            label={'Chain name'}
            placeholder={'BTC, ETH, BNB, MATIC etc'}
            value={chain}
            onChangeText={setChain}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
          />
          <KInput
            label={'Token name'}
            placeholder={'BTC, ETH, WBTC, USDT, etc'}
            value={token}
            onChangeText={setToken}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
          />
          <KInput
            label={'Address'}
            placeholder={'Enter account address'}
            value={publicKey}
            onChangeText={setPublicKey}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
          />
          <View style={styles.spacer} />
          <KButton
            title={'Submit'}
            theme={'blue'}
            style={styles.button}
            icon={'check'}
            onPress={_handleSubmit}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default connectAccounts()(FIORegisterExternalScreen);
