import React, { useState, useEffect } from 'react';
import { SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_BLUE } from '../../theme/colors';
import styles from './SwapScreen.style';
import { KHeader, KText } from '../../components';
import { connectAccounts } from '../../redux';
import { log } from '../../logger/logger';

const SwapScreen = props => {
  const {
    navigation: { navigate, goBack },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;


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
          title={'Swap'}
          style={styles.header}
        />
      <KText>Swaps functionality coming soon.</KText>
      </View>
    </SafeAreaView>
  );
};

export default connectAccounts()(SwapScreen);