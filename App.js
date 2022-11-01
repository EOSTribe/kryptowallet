/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import createStore from './app/redux/store';
import MainTabScreen from './app/screens/MainTabScreen';
import "@walletconnect/react-native-compat";

const store = createStore();
const MainStack = createStackNavigator();

import {
  PinCodeScreen,
} from './app/screens';

const App = () => {
  const navigationRef = useRef(null);

  const timeoutPeriod = 5 * 60 * 1000; // 5 mins
  var lastUnlocked;

  useEffect(() => {
    AppState.addEventListener('change', _handleAppStateChange);
    navigationRef.current.navigate('PinCode');

    return () => {
      AppState.removeEventListener('change', _handleAppStateChange);
    };
  }, []);

  const _handleAppStateChange = nextAppState => {
    console.log('App state changed to', nextAppState);
    if (lastUnlocked) {
      let period = new Date().getTime() - lastUnlocked;
      if (period < timeoutPeriod) {
        console.log('Unlock not yet expired', period);
        return;
      }
    }
    if (nextAppState === 'active') {
      lastUnlocked = new Date().getTime();
      navigationRef.current.navigate('PinCode');
    }
  };
  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <MainStack.Navigator headerMode={'none'}>
          <MainStack.Screen name="MainTab" component={MainTabScreen} />
          <MainStack.Screen
            name="PinCode"
            component={PinCodeScreen}
            options={{ gestureEnabled: false }}
          />
        </MainStack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;
