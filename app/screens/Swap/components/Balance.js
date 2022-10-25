import React, { useCallback } from 'react';
import { KText } from '../../../components';
import { StyleSheet, View } from 'react-native';

const Balance = ({ style, type, balance, onMaxClick }) => {
  const handleMaxClick = useCallback(() => {
    onMaxClick(balance);
  }, [balance, onMaxClick]);

  return (
    <View style={style}>
      <KText style={styles.balanceText}>{'Balance: ' + balance}</KText>
      {false && balance > 0 && type === 'from' && (
        <KText style={styles.maxBalanceText} onPress={handleMaxClick}>
          {'Max'}
        </KText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  balanceText: { color: 'gray', paddingRight: 10 },
  maxBalanceText: { color: '#78a7e6', fontWeight: 'bold', paddingRight: 20 },
});
export default Balance;
