import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Clipboard,
} from 'react-native';

// import  Clipboard  from '@react-native-community/clipboard';
import KText from './KText';
import { PRIMARY_BLUE } from '../theme/colors';
import { unstoppabledDomanModule } from '../ethereum/ethereum';

const KUnstoppabledDomainInput = ({ label, chainName, setUDAddress, secureTextEntry, containerStyle, ...props }) => {
  const { getAddress } = unstoppabledDomanModule();
  const [showText, setShowText] = useState(false);
  const [address, setAddress] = useState(undefined);
  const waitTime = 1000;
  const timer = useRef(null);

  const handlePressLabel = async () => {
    if (props.value) {
      setShowText(!showText);
    } else if (props.onPasteHandler) {
      props.value = '';
      props.value = await Clipboard.getString();
      props.onPasteHandler(props.value);
    }
  };

  const getHideShowPasteText = () => {
    if (secureTextEntry && props.value) {
      return showText ? 'Hide' : 'Show';
    } else if (props.onPasteHandler) {
      return 'Paste';
    } else {
      return '';
    }
  };

  const onChangeText = async (value) => {
    props.onChangeText(value);

    // Clear timer
    clearTimeout(timer.current);

    // Wait for X ms and then process the request
    timer.current = setTimeout(async () => {
      let res = await getAddress(chainName, value);
      setAddress(res);
      if (res)
        setUDAddress(res);
    }, waitTime);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <KText style={styles.label}>{label}</KText>
      <TextInput
        {...props}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showText}
        underlineColorAndroid={'transparent'}
        style={styles.input}
      />
      {!!props.onPasteHandler && (
        <TouchableOpacity
          style={styles.showButton}
          onPress={() => handlePressLabel()}>
          <KText style={styles.label}>{getHideShowPasteText()}</KText>
        </TouchableOpacity>
      )}
      {address && <KText style={styles.address}>{address}</KText>}
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
  input: {
    marginTop: Platform.OS === 'ios' ? 12 : 0,
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#273D52',
    lineHeight: 22,
    marginBottom: 12,
  },
  showButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

export default KUnstoppabledDomainInput;
