import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { KHeader, KButton, KText, KInput, FourIconsButtons } from '../../components';
import styles from './AccountDetailsScreen.style';
import { connectAccounts } from '../../redux';
import { getAccount, stake, unstake, buyram, sellram } from '../../eos/eos';
import { getChain } from '../../eos/chains';
import { PRIMARY_BLUE } from '../../theme/colors';
import { findIndex } from 'lodash';
import { log } from '../../logger/logger';

const ResourceManagementScreen = props => {
  // Form values:
  const [cpuNewStaked, setCpuNewStaked] = useState(0);
  const [netNewStaked, setNetNewStaked] = useState(0);
  const [cpuNewUnstaked, setCpuNewUnstaked] = useState(0);
  const [netNewUnstaked, setNetNewUnstaked] = useState(0);
  const [newRamAmount, setNewRamAmount] = useState(0);
  const [sellRamBytes, setSellRamBytes] = useState(0);
  const [loadingStake, setLoadingStake] = useState(false);
  const [loadingRAM, setLoadingRAM] = useState(false);
  const [tabStakeUnstakeRAM, setTabStakeUnstakeRAM] = useState(1);

  const {
    navigation: { navigate, goBack },
    route: {
      params: { account, params },
    },
  } = props;

  const _handleCpuNetStake = async () => {
    let cpuStake = parseFloat(cpuNewStaked);
    if (isNaN(cpuStake)) {
      Alert.alert('Please input valid amount for CPU stake');
      return;
    }
    let netStake = parseFloat(netNewStaked);
    if (isNaN(netStake)) {
      Alert.alert('Please input valid amount for NET stake');
      return;
    }
    let totalStake = cpuStake + netStake;
    let totalAvailable = parseFloat(params.liquidNumber);
    if (totalStake > totalAvailable) {
      Alert.alert('Can not stake more then available balance');
      return;
    }
    let chain = getChain(account.chainName);
    if (!chain) {
      // Should never happen
      Alert.alert('Unknown chain: ' + account.chainName);
      return;
    }
    // Do Staking:
    setLoadingStake(true);
    try {
      await stake(account, cpuStake, netStake, chain);
      setLoadingStake(false);
      Alert.alert(
        'Successfully staked!',
      );
    } catch (err) {
      let errorMsg = err.message !== undefined ? err.message : err;
      Alert.alert(errorMsg);
      setLoadingStake(false);
      log({
        description: '_handleCpuNetStake',
        cause: errorMsg,
        location: 'ResourceManagementScreen',
      });
    }
  };

  const _handleCpuNetUnstake = async () => {
    let cpuUnstake = parseFloat(cpuNewUnstaked);
    if (isNaN(cpuUnstake)) {
      Alert.alert('Please input valid amount for CPU unstake');
      return;
    }
    let netUnstake = parseFloat(netNewUnstaked);
    if (isNaN(netUnstake)) {
      Alert.alert('Please input valid amount for NET unstake');
      return;
    }
    let totalCpuStaked = parseFloat(params.cpuStaked);
    let totalNetStaked = parseFloat(params.netStaked);
    if (cpuUnstake >= totalCpuStaked) {
      Alert.alert('CPU unstake over limit: '+totalCpuStaked);
      return;
    }
    if (netUnstake >= totalNetStaked) {
      Alert.alert('NET unstake over limit: '+totalNetStaked);
      return;
    }
    let chain = getChain(account.chainName);
    if (!chain) {
      // Should never happen
      Alert.alert('Unknown chain: ' + account.chainName);
      return;
    }
    // Do Staking:
    setLoadingStake(true);
    try {
      await unstake(account, cpuUnstake, netUnstake, chain);
      setLoadingStake(false);
      Alert.alert(
        'Successfully unstaked!',
      );
    } catch (err) {
      let errorMsg = err.message !== undefined ? err.message : err;
      Alert.alert(errorMsg);
      setLoadingStake(false);
      log({
        description: '_handleCpuNetUnstake',
        cause: errorMsg,
        location: 'ResourceManagementScreen',
      });
    }
  };

  const _handleBuyRam = async () => {
    let ramAmount = parseFloat(newRamAmount);
    if (isNaN(ramAmount)) {
      Alert.alert('Please input valid amount to buy RAM');
      return;
    }
    let totalAvailable = parseFloat(params.liquidNumber);
    if (ramAmount > totalAvailable) {
      Alert.alert('Can not use more then available balance');
      return;
    }
    let chain = getChain(account.chainName);
    if (!chain) {
      // Should never happen
      Alert.alert('Unknown chain: ' + account.chainName);
      return;
    }
    setLoadingRAM(true);
    try {
      await buyram(account, ramAmount, chain);
      setLoadingRAM(false);
      Alert.alert(
        'Successfully bought RAM!',
      );
    } catch (err) {
      let errorMsg = err.message !== undefined ? err.message : err;
      Alert.alert(errorMsg);
      setLoadingRAM(false);
      log({
        description: '_handleBuyRam',
        cause: errorMsg,
        location: 'ResourceManagementScreen',
      });
    }
  };

  const _handleSellRam = async () => {
    let ramBytes = parseInt(sellRamBytes);
    if (isNaN(ramBytes)) {
      Alert.alert('Please input valid integer bytes');
      return;
    }
    let ramUsed = parseInt(params.ramUsed);
    let ramQuota = parseInt(params.ramQuota);
    if (ramBytes >= (ramQuota - ramUsed)) {
      Alert.alert('RAM bytes to sell above available quota');
      return;
    }
    let chain = getChain(account.chainName);
    if (!chain) {
      Alert.alert('Unknown chain: ' + account.chainName);
      return;
    }
    setLoadingRAM(true);
    try {
      await sellram(account, ramBytes, chain);
      setLoadingRAM(false);
      Alert.alert(
        'Successfully sold RAM!',
      );
    } catch (err) {
      let errorMsg = err.message !== undefined ? err.message : err;
      Alert.alert(errorMsg);
      setLoadingRAM(false);
      log({
        description: '_handleSellRam',
        cause: errorMsg,
        location: 'ResourceManagementScreen',
      });
    }
  };

  const checkPowerUpResponse = (json) => {
    if(json.result) {
      Alert.alert("Account powered up!");
    } else {
      Alert.alert("Something went wrong: "+json);
    }
  };

  const _handlePowerUpAccount = async () => {
    const powerUpUrl = "https://api.eospowerup.io/freePowerup/"+account.accountName;
    try {
      fetch(powerUpUrl, { method: 'GET' })
        .then(response => response.json())
        .then(json => checkPowerUpResponse(json))
        .catch(error => Alert.alert("Error calling PowerUp EOS account service"));
    } catch (err) {
      Alert.alert("PowerUp Error: "+err);
    }
  };

  var eosPowerupButton = <View style={styles.spacer} />;
  if (account.chainName === 'EOS') {
    eosPowerupButton = (
      <View>
        <KButton
          title={'PowerUp Account'}
          theme={'brown'}
          style={styles.button}
          icon={'add'}
          onPress={_handlePowerUpAccount}
        />
        <View style={styles.spacer} />
      </View>
    );
  }

if(tabStakeUnstakeRAM === 1) {

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContentContainer}
        enableOnAndroid>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <MaterialIcon
              name={'keyboard-backspace'}
              size={24}
              color={PRIMARY_BLUE}
            />
          </TouchableOpacity>
          <KHeader
            title={'Resource management'}
            subTitle={account.accountName}
            style={styles.header}
          />
          <KText>Available balance: {params.liquidBalance}</KText>
          <KText>
            Staked CPU/NET: {params.cpuStaked} / {params.netStaked}
          </KText>
          {eosPowerupButton}
          <View style={styles.spacer} />
          <KInput
            label={'Stake for CPU'}
            placeholder={'Enter amount to stake for CPU'}
            value={cpuNewStaked}
            onChangeText={setCpuNewStaked}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KInput
            label={'Stake for NET'}
            placeholder={'Enter amount to stake for NET'}
            value={netNewStaked}
            onChangeText={setNetNewStaked}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KButton
            title={'Stake for CPU / NET'}
            theme={'blue'}
            style={styles.button}
            icon={'add'}
            isLoading={loadingStake}
            onPress={_handleCpuNetStake}
          />
          <FourIconsButtons
              onIcon1Press={()=>setTabStakeUnstakeRAM(1)}
              onIcon2Press={()=>setTabStakeUnstakeRAM(2)}
              onIcon3Press={()=>setTabStakeUnstakeRAM(3)}
              onIcon4Press={()=>setTabStakeUnstakeRAM(4)}
              icon1={() => (
                <Image
                  source={require('../../../assets/icons/stake.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon2={() => (
                <Image
                  source={require('../../../assets/icons/unstake.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon3={() => (
                <Image
                  source={require('../../../assets/icons/buy_ram.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon4={() => (
                <Image
                  source={require('../../../assets/icons/sell_ram.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );

} else if(tabStakeUnstakeRAM === 2) {

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContentContainer}
        enableOnAndroid>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <MaterialIcon
              name={'keyboard-backspace'}
              size={24}
              color={PRIMARY_BLUE}
            />
          </TouchableOpacity>
          <KHeader
            title={'Resource management'}
            subTitle={account.accountName}
            style={styles.header}
          />
          <KText>Available balance: {params.liquidBalance}</KText>
          <KText>
            Staked CPU/NET: {params.cpuStaked} / {params.netStaked}
          </KText>
          <View style={styles.spacer} />
          <KInput
            label={'Unstake from CPU'}
            placeholder={'Enter amount to unstake from CPU'}
            value={cpuNewUnstaked}
            onChangeText={setCpuNewUnstaked}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KInput
            label={'Unstake from NET'}
            placeholder={'Enter amount to unstake from NET'}
            value={netNewUnstaked}
            onChangeText={setNetNewUnstaked}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KButton
            title={'Unstake from CPU / NET'}
            theme={'brown'}
            style={styles.button}
            icon={'remove'}
            isLoading={loadingStake}
            onPress={_handleCpuNetUnstake}
          />
          <FourIconsButtons
              onIcon1Press={()=>setTabStakeUnstakeRAM(1)}
              onIcon2Press={()=>setTabStakeUnstakeRAM(2)}
              onIcon3Press={()=>setTabStakeUnstakeRAM(3)}
              onIcon4Press={()=>setTabStakeUnstakeRAM(4)}
              icon1={() => (
                <Image
                  source={require('../../../assets/icons/stake.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon2={() => (
                <Image
                  source={require('../../../assets/icons/unstake.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon3={() => (
                <Image
                  source={require('../../../assets/icons/buy_ram.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon4={() => (
                <Image
                  source={require('../../../assets/icons/sell_ram.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );

} else if(tabStakeUnstakeRAM === 3) {

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContentContainer}
        enableOnAndroid>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <MaterialIcon
              name={'keyboard-backspace'}
              size={24}
              color={PRIMARY_BLUE}
            />
          </TouchableOpacity>
          <KHeader
            title={'Resource management'}
            subTitle={account.accountName}
            style={styles.header}
          />
          <KText>Available balance: {params.liquidBalance}</KText>
          <KText>
            RAM Used/Quota: {params.ramUsed}/{params.ramQuota} bytes
          </KText>
          <KInput
            label={'Buy RAM'}
            placeholder={'Enter amount to buy RAM'}
            value={newRamAmount}
            onChangeText={setNewRamAmount}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KButton
            title={'Buy RAM'}
            theme={'blue'}
            style={styles.button}
            icon={'add'}
            isLoading={loadingRAM}
            onPress={_handleBuyRam}
          />
          <FourIconsButtons
              onIcon1Press={()=>setTabStakeUnstakeRAM(1)}
              onIcon2Press={()=>setTabStakeUnstakeRAM(2)}
              onIcon3Press={()=>setTabStakeUnstakeRAM(3)}
              onIcon4Press={()=>setTabStakeUnstakeRAM(4)}
              icon1={() => (
                <Image
                  source={require('../../../assets/icons/stake.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon2={() => (
                <Image
                  source={require('../../../assets/icons/unstake.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon3={() => (
                <Image
                  source={require('../../../assets/icons/buy_ram.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon4={() => (
                <Image
                  source={require('../../../assets/icons/sell_ram.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );

} else {

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContentContainer}
        enableOnAndroid>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <MaterialIcon
              name={'keyboard-backspace'}
              size={24}
              color={PRIMARY_BLUE}
            />
          </TouchableOpacity>
          <KHeader
            title={'Resource management'}
            subTitle={account.accountName}
            style={styles.header}
          />
          <KText>Available balance: {params.liquidBalance}</KText>
          <KText>
            RAM Used/Quota: {params.ramUsed}/{params.ramQuota} bytes
          </KText>
          <KInput
            label={'Sell RAM (in bytes)'}
            placeholder={'Enter bytes of RAM to sell'}
            value={sellRamBytes}
            onChangeText={setSellRamBytes}
            containerStyle={styles.inputContainer}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KButton
            title={'Sell RAM'}
            theme={'brown'}
            style={styles.button}
            icon={'remove'}
            isLoading={loadingRAM}
            onPress={_handleSellRam}
          />
          <FourIconsButtons
              onIcon1Press={()=>setTabStakeUnstakeRAM(1)}
              onIcon2Press={()=>setTabStakeUnstakeRAM(2)}
              onIcon3Press={()=>setTabStakeUnstakeRAM(3)}
              onIcon4Press={()=>setTabStakeUnstakeRAM(4)}
              icon1={() => (
                <Image
                  source={require('../../../assets/icons/stake.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon2={() => (
                <Image
                  source={require('../../../assets/icons/unstake.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon3={() => (
                <Image
                  source={require('../../../assets/icons/buy_ram.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon4={() => (
                <Image
                  source={require('../../../assets/icons/sell_ram.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );

}


};

export default connectAccounts()(ResourceManagementScreen);
