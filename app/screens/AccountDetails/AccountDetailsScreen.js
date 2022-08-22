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
import { PieChart, ProgressChart } from 'react-native-chart-kit';
import { KHeader, KButton, KText, FourIconsButtons } from '../../components';
import styles from './AccountDetailsScreen.style';
import { connectAccounts } from '../../redux';
import { getAccount } from '../../eos/eos';
import { getChain } from '../../eos/chains';
import { PRIMARY_BLUE } from '../../theme/colors';
import { findIndex } from 'lodash';
import { log } from '../../logger/logger';

const AccountDetailsScreen = props => {
  const [liquidBalance, setLiquidBalance] = useState();
  const [totalBalance, setTotalBalance] = useState();
  const [refundBalance, setRefundBalance] = useState();
  const [cpuStaked, setCpuStaked] = useState();
  const [netStaked, setNetStaked] = useState();
  const [liquidNumber, setLiquidNumber] = useState(0);
  const [refundNumber, setRefundNumber] = useState(0);
  const [cpuStakedNumber, setCpuStakedNumber] = useState(0);
  const [netStakedNumber, setNetStakedNumber] = useState(0);
  const [ramUsed, setRamUsed] = useState();
  const [ramQuota, setRamQuota] = useState();
  const [netUsagePct, setNetUsagePct] = useState(0);
  const [cpuUsagePct, setCpuUsagePct] = useState(0);
  const [ramUsagePct, setRamUsagePct] = useState(0);
  const [resourcesWarning, setResourcesWarning] = useState('');
  const [tabBalanceResource, setBalanceResource] = useState(1);


  const {
    navigation: { navigate, goBack },
    route: {
      params: { account },
    },
    deleteAccount,
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const maxRatio = 0.95;
  const chainPrefix = (account.chainName==="Telos") ? "TLOS" : account.chainName;
  const name = chainPrefix + ":" + account.accountName;
  var usdValue = 0;
  for (const elem of totals) {
    if(elem.account===name) {
      usdValue = elem.total;
      break;
    }
  }

  // Stake chart data:
  const stakeData = [
    {
      name: 'Liquid',
      balance: liquidNumber,
      color: 'rgba(42, 254, 106, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Refund',
      balance: refundNumber,
      color: 'rgba(254, 142, 42, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'CPU',
      balance: cpuStakedNumber,
      color: 'rgba(205, 227, 255, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'NET',
      balance: netStakedNumber,
      color: 'rgb(113, 175, 255)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];
  // Resource Chart data:
  const resourceData = {
    labels: ['NET', 'CPU', 'RAM'],
    data: [netUsagePct, cpuUsagePct, ramUsagePct],
  };
  // Common charts config:
  const screenWidth = Dimensions.get('window').width;
  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 2, // optional, defaults to 2dp
    color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  const loadAccount = async () => {
    const chain = getChain(account.chainName);
    const accountInfo = await getAccount(account.accountName, chain);
    var token = chain.symbol;
    // Calculate balance:
    var selfUnstaked = 0;
    if (accountInfo.core_liquid_balance) {
      token = accountInfo.core_liquid_balance.split(' ')[1];
      selfUnstaked = parseFloat(accountInfo.core_liquid_balance.split(' ')[0]);
      setLiquidBalance(accountInfo.core_liquid_balance);
      setLiquidNumber(selfUnstaked);
    } else {
      setLiquidBalance('0 ' + token);
      setLiquidNumber(0);
    }
    // Calculate self stakes:
    var selfCpuStaked = 0;
    var selfNetStaked = 0;
    if (accountInfo.self_delegated_bandwidth) {
      if (accountInfo.self_delegated_bandwidth.cpu_weight) {
        selfCpuStaked = parseFloat(
          accountInfo.self_delegated_bandwidth.cpu_weight.split(' ')[0],
        );
      }
      if (accountInfo.self_delegated_bandwidth.net_weight) {
        selfNetStaked = parseFloat(
          accountInfo.self_delegated_bandwidth.net_weight.split(' ')[0],
        );
      }
    }
    setCpuStakedNumber(selfCpuStaked);
    setNetStakedNumber(selfNetStaked);
    // Calculate refund amount:
    var refund = accountInfo.refund_request;
    var totRefund = 0;
    if (refund) {
      var cpuRefund = refund.cpu_amount
        ? parseFloat(refund.cpu_amount.split(' ')[0])
        : 0;
      var netRefund = refund.net_amount
        ? parseFloat(refund.net_amount.split(' ')[0])
        : 0;
      totRefund = cpuRefund + netRefund;
      setRefundNumber(totRefund);
    }
    var total = (
      selfUnstaked +
      selfCpuStaked +
      selfNetStaked +
      totRefund
    ).toFixed(4);
    setTotalBalance(total + ' ' + token);
    setRefundBalance(totRefund + ' ' + token);
    if (accountInfo.total_resources && accountInfo.total_resources.cpu_weight) {
      setCpuStaked(accountInfo.total_resources.cpu_weight);
    }
    if (accountInfo.total_resources && accountInfo.total_resources.net_weight) {
      setNetStaked(accountInfo.total_resources.net_weight);
    }
    if (accountInfo.ram_usage) {
      setRamUsed(accountInfo.ram_usage);
    }
    if (accountInfo.ram_quota) {
      setRamQuota(accountInfo.ram_quota);
    }
    if (accountInfo.ram_usage && accountInfo.ram_quota) {
      var ratioRAM = accountInfo.ram_usage / accountInfo.ram_quota;
      setRamUsagePct(ratioRAM);
      if (ratioCPU > maxRatio) {
        setResourcesWarning(
          'RAM usage is too high - you may not be able to submit transactions from this account.',
        );
      }
    }
    if (accountInfo.cpu_limit) {
      var usedCPU = accountInfo.cpu_limit.used
        ? parseFloat(accountInfo.cpu_limit.used)
        : 0;
      var availableCPU = accountInfo.cpu_limit.available
        ? parseFloat(accountInfo.cpu_limit.available)
        : 0;
      var totalCPU = usedCPU + availableCPU;
      var ratioCPU = usedCPU / totalCPU;
      setCpuUsagePct(ratioCPU);
      if (ratioCPU > maxRatio) {
        setResourcesWarning(
          'CPU usage is too high - you may not be able to submit transactions from this account.',
        );
      }
    }
    if (accountInfo.net_limit) {
      var usedNET = accountInfo.net_limit.used;
      var availableNET = accountInfo.net_limit.available;
      var totalNET = usedNET + availableNET;
      var ratioNET = usedNET / totalNET;
      setNetUsagePct(ratioNET);
      if (ratioNET > maxRatio) {
        setResourcesWarning(
          'NET usage is too high - you may not be able to submit transactions from this account.',
        );
      }
    }
  };

  const _handleDeleteAccount = index => {
    deleteAccount(index);
    goBack();
  };

  const _handleRemoveAccount = () => {
    const index = findIndex(
      accounts,
      el =>
        el.accountName === account.accountName &&
        el.chainName === account.chainName,
    );
    Alert.alert(
      'Delete ' + account.accountName + ' account',
      'Are you sure you want to delete this account?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Delete account cancelled'),
          style: 'cancel',
        },
        { text: 'OK', onPress: () => _handleDeleteAccount(index) },
      ],
      { cancelable: false },
    );
  };

  const _handleBackupKey = () => {
    navigate('PrivateKeyBackup', { account });
  };

  const _handleManageResources = () => {
    const params = {
      liquidBalance: liquidBalance,
      liquidNumber: liquidNumber,
      totalBalance: totalBalance,
      refundBalance: refundBalance,
      refundNumber: refundNumber,
      cpuStaked: cpuStaked,
      netStaked: netStaked,
      cpuStakedNumber: cpuStakedNumber,
      netStakedNumber: netStakedNumber,
      ramUsed: ramUsed,
      ramQuota: ramQuota,
    };
    navigate('ResourceManagement', { account, params });
  };

  const _handleVoteBP = () => {
    navigate('Vote', { account });
  };

  const getChainIcon = (name) => {
    if(name == "EOS") {
      return (<Image
        source={require('../../../assets/chains/eos.png')}
        style={styles.buttonIcon}
      />);
    } else if(name == "TLOS") {
      <Image
        source={require('../../../assets/chains/telos.png')}
        style={styles.buttonIcon}
      />
    }
    return (<View style={styles.spacer} />);
  }

  loadAccount();

if (tabBalanceResource === 1) {

  return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContentContainer}
          enableOnAndroid>
          <View style={styles.inner}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <MaterialIcon
                name={'keyboard-backspace'}
                size={35}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
            <View style={styles.spacer} />
            {getChainIcon(account.chainName)}
            <View style={styles.spacer} />
            <KText>Available: {liquidBalance}</KText>
            <KText>USD Value: ${usdValue}</KText>
            <KText>Total balance: {totalBalance}</KText>
            <KText>Refunding balance: {refundBalance}</KText>
            <KText>CPU Staked: {cpuStaked}</KText>
            <KText>NET Staked: {netStaked}</KText>
            <KText>
              RAM Used/Quota: {ramUsed}/{ramQuota} bytes
            </KText>
            <FourIconsButtons
              onIcon1Press={_handleManageResources}
              onIcon2Press={_handleVoteBP}
              onIcon3Press={_handleBackupKey}
              onIcon4Press={_handleRemoveAccount}
              icon1={() => (
                <Image
                  source={require('../../../assets/icons/manage_resources.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon2={() => (
                <Image
                  source={require('../../../assets/icons/vote.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon3={() => (
                <Image
                  source={require('../../../assets/icons/save_key.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon4={() => (
                <Image
                  source={require('../../../assets/icons/delete.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
            <KText>Staked vs liquid balances: </KText>
            <PieChart
              data={stakeData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="balance"
              backgroundColor="transparent"
              absolute
            />
            <KButton
              title={'View resources usage'}
              style={styles.button}
              onPress={() => setBalanceResource(2)}
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
                size={35}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
            <View style={styles.spacer} />
            {getChainIcon(account.chainName)}
            <View style={styles.spacer} />
            <KText>Available: {liquidBalance}</KText>
            <KText>USD Value: ${usdValue}</KText>
            <KText>Total balance: {totalBalance}</KText>
            <KText>Refunding balance: {refundBalance}</KText>
            <KText>CPU Staked: {cpuStaked}</KText>
            <KText>NET Staked: {netStaked}</KText>
            <KText>
              RAM Used/Quota: {ramUsed}/{ramQuota} bytes
            </KText>
            <FourIconsButtons
              onIcon1Press={_handleManageResources}
              onIcon2Press={_handleVoteBP}
              onIcon3Press={_handleBackupKey}
              onIcon4Press={_handleRemoveAccount}
              icon1={() => (
                <Image
                  source={require('../../../assets/icons/manage_resources.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon2={() => (
                <Image
                  source={require('../../../assets/icons/vote.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon3={() => (
                <Image
                  source={require('../../../assets/icons/save_key.png')}
                  style={styles.buttonIcon}
                />
              )}
              icon4={() => (
                <Image
                  source={require('../../../assets/icons/delete.png')}
                  style={styles.buttonIcon}
                />
              )}
            />
            <KText>Resources usage: </KText>
            <ProgressChart
              data={resourceData}
              width={screenWidth}
              height={220}
              strokeWidth={16}
              radius={32}
              chartConfig={chartConfig}
              hideLegend={false}
            />
            <KText style={styles.alert}>{resourcesWarning}</KText>
            <KButton
              title={'View staked/liquid balances'}
              style={styles.button}
              onPress={() => setBalanceResource(1)}
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
}


}


export default connectAccounts()(AccountDetailsScreen);
