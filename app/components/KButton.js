import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import KText from './KText';
import LinearGradient from 'react-native-linear-gradient';
import Spinner from 'react-native-spinkit';

const KButton = ({
  title,
  theme = 'primary',
  icon,
  style,
  textStyle,
  renderIcon,
  isLoading = false,
  ...props
}) => {
  const getGradientColors = () => {
    let colors = ['#6A63EE', '#59D4FC'];
    if (theme === 'primary') {
      colors = ['#6A63EE', '#59D4FC'];
    } else if (theme === 'brown') {
      colors = ['#E06C39', '#DF8856'];
    } else if (theme === 'gray') {
      colors = ['#C6D3DD', '#C6D3DD'];
    } else if (theme === 'grey') {
      colors = ['#C6D3DD', '#C6D3DD'];
    }

    return colors;
  };

  const renderMaterialIcon = () => {
    if (!!icon && typeof icon === 'string') {
      return <Icon name={icon} style={styles.icon} />;
    }

    return null;
  };

  const renderIconComponent = () => {
    if (!!renderIcon && typeof renderIcon === 'function') {
      return <View style={styles.iconComponentWrapper}>{renderIcon()}</View>;
    }

    return null;
  };

  return (
    <TouchableOpacity style={style} {...props} disabled={isLoading}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={getGradientColors()}
        style={styles.container}>
        {renderMaterialIcon()}
        {renderIconComponent()}
        <KText style={[styles.title, textStyle]}>{title}</KText>
        <Spinner
          type={'FadingCircle'}
          size={16}
          color={'#FFF'}
          style={styles.spinner}
          isVisible={isLoading}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 18,
    color: '#FFF',
    marginRight: 8,
  },
  iconComponentWrapper: {
    marginRight: 8,
  },
  spinner: {
    marginLeft: 8,
  },
});

export default KButton;
