import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';


const AccountButtons = ({
  menuIcon,
  addIcon,
  onAddPress,
  importIcon,
  onMenuPress,
  onImportPress,
  exportIcon,
  onExportPress,
  nftShowStatus,
}) => {

  return (
    <View style={styles.rowContainer}>
      {/* {nftShowStatus ? */}
        <TouchableOpacity onPress={onMenuPress}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={['#FFFFFF', '#FFFFFF']}
            style={styles.container}>
            <View style={styles.icon}>{menuIcon()}</View>
          </LinearGradient>
        </TouchableOpacity>
        {/* :
        null
      } */}
      <TouchableOpacity onPress={onExportPress}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={['#FFFFFF', '#FFFFFF']}
          style={styles.container}>
          <View style={styles.icon}>{exportIcon()}</View>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={onImportPress}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={['#FFFFFF', '#FFFFFF']}
          style={styles.container}>
          <View style={styles.icon}>{importIcon()}</View>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={onAddPress}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={['#FFFFFF', '#FFFFFF']}
          style={styles.container}>
          <View style={styles.icon}>{addIcon()}</View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 8,
    margin: 5,
  },
  rowContainer: {
    marginTop: 5,
    flexDirection: 'column',
  },
  icon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AccountButtons;
