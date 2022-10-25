import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

import KText from './KText';
import { PRIMARY_BLUE, PRIMARY_BLACK } from '../theme/colors';
import RNPickerSelect from 'react-native-picker-select';

const KSelect = ({
  label,
  secureTextEntry,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <KText style={styles.label}>{label}</KText>
      <RNPickerSelect
        {...props}
        placeholder={{
          label: 'Please select...',
          value: null,
          color: '#9EA0A4',
        }}
        fixAndroidTouchableBug={true}
        useNativeAndroidPickerStyle={false}
        style={{
          viewContainer: styles.picker,
          placeholder: styles.placeholderStyle,
          inputIOS: [styles.pickerInput, style],
          inputAndroid: [styles.pickerInput, style],
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: '#E5E5EE',
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    color: PRIMARY_BLUE,
  },
  showButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  picker: {
    marginTop: Platform.OS === 'ios' ? 12 : 0,
    marginBottom: Platform.OS === 'ios' ? 12 : 4,
  },
  placeholderStyle: {
    fontFamily: 'Nunito-Bold',
  },
  pickerInput: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: PRIMARY_BLACK,
  },
});

export default KSelect;
