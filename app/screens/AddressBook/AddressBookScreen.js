import React, { useState } from 'react';
import {
  Image,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Text,
  Alert,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KButton, KHeader, OneIconButton } from '../../components';
import AddressListItem from './components/AddressListItem';
import styles from './AddressBookScreen.style';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import { connectAccounts } from '../../redux';
import { log } from '../../logger/logger';
import { PRIMARY_BLUE } from '../../theme/colors';

const AddressBookScreen = props => {
  const {
    deleteAddress,
    navigation: { navigate, goBack },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  // Remove duplicate addresses:
  addresses.map((value, index, array) => {
    var counter = 0;
    addresses.map(function(item, index2) {
      if (item.address === value.address) {
        counter++;
        if (counter > 1) {
          deleteAddress(index2);
        }
      }
    });
  });

  const fioAccounts = accounts.filter((value, index, array) => {
    return value.chainName == 'FIO';
  });

  var fromActor;
  if (fioAccounts.length > 0) {
    const fromAccount = fioAccounts[0];
    const fromPrivateKey = fromAccount.privateKey;
    const fromPublicKey = Ecc.privateToPublic(fromPrivateKey);
    fromActor = Fio.accountHash(fromPublicKey);
  }

  const _handleEditAddress = index => {
    let fioAddress = addresses[index];
    navigate('EditAddress', { fioAddress, index });
  };

  const _handleAddAddress = () => {
    navigate('AddAddress');
  }

  if (fioAccounts.length == 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <KHeader title={'Address Book'} style={styles.header} />
          <FlatList
            data={addresses.sort((a, b) => a.name.localeCompare(b.name))}
            keyExtractor={(item, index) => `${index}`}
            renderItem={({ item, index }) => (
              <AddressListItem
                address={item}
                fromactor={fromActor}
                style={styles.listItem}
                onEdit={() => _handleEditAddress(index)}
              />
            )}
          />
          <OneIconButton
            onIconPress={_handleAddAddress}
            icon={() => (
              <Image
                source={require('../../../assets/icons/add_contact.png')}
                style={styles.buttonIcon}
              />
            )}
          />
        </View>
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <KHeader title={'Address Book'} style={styles.header} />
          <FlatList
            data={addresses.sort((a, b) => a.name.localeCompare(b.name))}
            keyExtractor={(item, index) => `${index}`}
            renderItem={({ item, index }) => (
              <AddressListItem
                address={item}
                fromactor={fromActor}
                style={styles.listItem}
                onPress={() => _handleEditAddress(index)}
                onEdit={() => _handleEditAddress(index)}
              />
            )}
          />
          <OneIconButton
            onIconPress={_handleAddAddress}
            icon={() => (
              <Image
                source={require('../../../assets/icons/add_contact.png')}
                style={styles.buttonIcon}
              />
            )}
          />
        </View>
      </SafeAreaView>
    );
  }
};

export default connectAccounts()(AddressBookScreen);
