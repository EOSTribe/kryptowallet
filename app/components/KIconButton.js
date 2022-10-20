import * as React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const KIconButton = ({ onPress, style, name, size }) => (
  <TouchableOpacity style={style} onPress={onPress}>
    <MaterialIcon name={name} style={styles.iconStyle} size={size} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  iconStyle: { color: '#5ea2f6' },
});

export default KIconButton;
