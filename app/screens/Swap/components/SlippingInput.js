import React from 'react';
import { View, StyleSheet } from 'react-native';

import { KText } from '../../../components';
import { PRIMARY_BLUE, PRIMARY_BLACK } from '../../../theme/colors';
import { TextInput } from 'react-native-gesture-handler';

const SlippingInput = ({ label, containerStyle, value, onChange }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <KText style={styles.label}>{label}</KText>
      <TextInput
        value={value}
        onChange={onChange}
        underlineColorAndroid={'transparent'}
        style={styles.input}
        placeholder="Please input slipping"
        autoCapitalize={'none'}
        keyboardType={'numeric'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 5,
    marginLeft: 20,
    marginRight: 20,
  },
  label: {
    fontSize: 18,
    color: PRIMARY_BLUE,
  },

  input: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: PRIMARY_BLACK,
    borderColor: '#E5E5EE',
    borderBottomWidth: 3,
    width: 200,
  },
});

export default SlippingInput;
