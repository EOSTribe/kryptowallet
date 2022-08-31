import React from 'react';
import { SafeAreaView, View, TouchableOpacity, Alert, } from 'react-native';
import styles from './MenuScreen.style';
import { KHeader, KButton } from '../../components';
import { connectAccounts } from '../../redux';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_BLUE } from '../../theme/colors';

const TabMenuScreen = props => {
  const {
    connectAccount,
    resetWallet,
    navigation: { navigate },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const adminAccount = accounts.filter((value, index, array) => {
    return (value != null && value.chainName === 'FIO' && value.address === 'admin@tribe');
  });


  const purgeWallet = () => {
    Alert.alert(
      'Delete all wallet data and reset wallet',
      'Are you sure you want to purge wallet?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Purge wallet cancelled'),
          style: 'cancel',
        },
        { text: 'OK', onPress: () => resetWallet() },
      ],
      { cancelable: false },
    );
  };

  var adminButton = <View style={styles.spacer} />;
  if (adminAccount.length > 0) {
    adminButton = (
      <KButton
        title={'Admin'}
        style={styles.button}
        onPress={() => navigate('Admin')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <KHeader title={'Menu actions'} style={styles.header} />
        <View style={styles.spacer} />
        <KButton
          title={'Address book'}
          style={styles.button}
          onPress={() => navigate('AddressBook')}
        />
        <KButton
          title={'Recover Private Key'}
          style={styles.button}
          onPress={() => navigate('RecoverPrivateKey')}
        />
        <KButton
          title={'List all keys in wallet'}
          style={styles.button}
          onPress={() => navigate('KeyList')}
        />
        <KButton
          title={'Purge wallet'}
          style={styles.button}
          onPress={() => purgeWallet()}
        />
        {adminButton}
      </View>
    </SafeAreaView>
  );

};

export default connectAccounts()(TabMenuScreen);
