import * as React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const KIconButton = ({ onChange, style }) => (
  <TouchableOpacity style={style} onPress={onChange}>
    <MaterialIcon
      name="swap-vertical-circle-outline"
      style={styles.iconStyle}
      size={30}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  iconStyle: { color: '#5ea2f6' },
});

export default KIconButton;
