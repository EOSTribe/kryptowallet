import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Clipboard,
} from 'react-native';
import KText from './KText';
import { PRIMARY_BLUE } from '../theme/colors';

const KInput = ({
  label,
  secureTextEntry,
  containerStyle,
  style,
  ...props
}) => {
  const [showText, setShowText] = useState(false);

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

  return (
    <View style={[styles.container, containerStyle]}>
      <KText style={styles.label}>{label}</KText>
      <TextInput
        {...props}
        secureTextEntry={secureTextEntry && !showText}
        underlineColorAndroid={'transparent'}
        style={[styles.input, style]}
      />
      {!!props.onPasteHandler && (
        <TouchableOpacity
          style={styles.showButton}
          onPress={() => handlePressLabel()}>
          <KText style={styles.label}>{getHideShowPasteText()}</KText>
        </TouchableOpacity>
      )}
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

export default KInput;
