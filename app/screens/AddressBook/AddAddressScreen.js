import React, { useState } from 'react';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import {
  Image,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Text,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KInput, KButton, KHeader, KText, OneIconButton } from '../../components';
import styles from './AddressBookScreen.style';
import { connectAccounts } from '../../redux';
import { log } from '../../logger/logger';
import { getEndpoint } from '../../eos/chains';
import { PRIMARY_BLUE } from '../../theme/colors';

const AddAddressScreen = props => {
  const {
    addAddress,
    accountsState: { accounts, addresses, keys, totals, history, config },
    navigation: { navigate },
  } = props;

  const [name, setName] = useState('');
  const [address, setAddress] = useState();
  const [fioAddress, setFioAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [actor, setActor] = useState();
  const [publicKey, setPublicKey] = useState();
  const [addressInvalidMessage, setAddressInvalidMessage] = useState();

  const fioEndpoint = getEndpoint('FIO');

  const _handleBack = () => {
    navigate('AddressBook');
  };

  const _validateAddress = address => {
    if (
      address.length >= 3 &&
      address.indexOf('@') > 0 &&
      address.indexOf('@') < address.length - 1
    ) {
      fetch(fioEndpoint + '/v1/chain/avail_check', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fio_name: address,
        }),
      })
        .then(response => response.json())
        .then(json => updateAvailableState(json.is_registered, address))
        .catch(error => updateAvailableState(-1, address, error));
    }
  };

  const updateAvailableState = (regcount, address, error) => {
    if (regcount === 0) {
      setAddressInvalidMessage('Invalid FIO address!');
      setIsValidAddress(false);
      setFioAddress('');
      setActor('');
      setPublicKey('');
    } else if (regcount === 1) {
      setAddressInvalidMessage('');
      setIsValidAddress(true);
      setFioAddress(address);
      loadToPubkey(address);
    } else if (error) {
      //console.log(error);
      setAddressInvalidMessage('Error validating FIO address');
      setIsValidAddress(false);
      setFioAddress('');
      setActor('');
      setPublicKey('');
      log({
        description:
          '_validateAddress - fetch ' + fioEndpoint + '/v1/chain/avail_check',
        cause: error,
        location: 'TransferScreen',
      });
    }
  };

  const loadToPubkey = async address => {
    fetch(fioEndpoint + '/v1/chain/get_pub_address', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_address: address,
        chain_code: 'FIO',
        token_code: 'FIO',
      }),
    })
      .then(response => response.json())
      .then(json => processToPubkeyUpdate(json.public_address))
      .catch(error =>
        log({
          description:
            'loadToPubkey - fetch ' + fioEndpoint + '/v1/chain/get_pub_address',
          cause: error,
          location: 'AddAddressScreen',
        }),
      );
  };

  const processToPubkeyUpdate = async publicKey => {
    setPublicKey(publicKey);
    const accountHash = Fio.accountHash(publicKey);
    setActor(accountHash);
  };

  const _handleAddAddress = () => {
    if (fioAddress && publicKey) {
      let addressJson = {
        name: name,
        address: fioAddress,
        actor: actor,
        publicKey: publicKey,
      };
      let matchingAddresses = addresses.filter(
        (item, index) => item.address === fioAddress,
      );
      if (matchingAddresses.length == 0) {
        addAddress(addressJson);
        _handleBack();
      } else {
        Alert.alert('This address already exists in the Address Book!');
      }
    } else {
      Alert.alert('Failed to load FIO address public key!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backButton} onPress={_handleBack}>
          <MaterialIcon
            name={'keyboard-backspace'}
            size={24}
            color={PRIMARY_BLUE}
          />
        </TouchableOpacity>
        <KHeader title={'Add FIO Address'} style={styles.header} />
        <KInput
          label={'FIO Address'}
          placeholder={'name@tribe'}
          value={address}
          onChangeText={_validateAddress}
          containerStyle={styles.inputContainer}
          autoCapitalize={'none'}
        />
        <KText style={styles.errorMessage}>{addressInvalidMessage}</KText>
        <KInput
          label={'Name'}
          placeholder={'Optional name for the address'}
          value={name}
          onChangeText={setName}
          containerStyle={styles.inputContainer}
          autoCapitalize={'none'}
        />
        <OneIconButton
            onIconPress={_handleAddAddress}
            icon={() => (
              <Image
                source={require('../../../assets/icons/save_key.png')}
                style={styles.buttonIcon}
              />
            )}
          />
      </View>
    </SafeAreaView>
  );
};

export default connectAccounts()(AddAddressScreen);
