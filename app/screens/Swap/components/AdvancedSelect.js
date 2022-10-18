import React from 'react';
import { View, StyleSheet, Picker } from 'react-native';
// import { Picker } from '@react-native-community/picker';

import { KText } from '../../../components';
import { PRIMARY_BLUE } from '../../../theme/colors';

const AdvancedSelect = ({ label, containerStyle, value, onChange, items }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <KText style={styles.label}>{label}</KText>
      <View style={styles.netWorkPickerContainer}>
        <Picker
          selectedValue={value}
          style={styles.input}
          onValueChange={onChange}>
          {items.map((item, index) => (
            <Picker.Item key={index} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
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
    borderBottomWidth: 2,
    borderBottomColor: '#c1c1c1',
    width: 200,
  },
  netWorkPickerContainer: {
    borderBottomColor: '#E5E5EE',
    borderBottomWidth: 2,
  },
});

export default AdvancedSelect;
