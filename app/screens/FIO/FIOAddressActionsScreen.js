import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Text,
  Linking,
  Alert,
} from 'react-native';
import ChainAddressItem from './components/ChainAddressItem';
import ConnectAddressItem from './components/ConnectAddressItem';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { PieChart, ProgressChart } from 'react-native-chart-kit';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import ecc from 'eosjs-ecc-rn';
import { fioAddPublicAddress } from '../../eos/fio';
import { log } from '../../logger/logger';
import styles from './FIOCommon.style';
import { KHeader, KText, KButton, FiveIconsButtons } from '../../components';
import { connectAccounts } from '../../redux';
import { PRIMARY_BLUE } from '../../theme/colors';
import { findIndex } from 'lodash';
import { getEndpoint } from '../../eos/chains';
import { getKeyPair } from '../../stellar/stellar';


const FIOAddressActionsScreen = props => {
  const [fioExpirationDate, setFioExpirationDate] = useState();
  const [fioRegistrationContent, setFioRegistrationContent] = useState();
  const [registrationLink, setRegistrationLink] = useState();
  const [executionCount, setExecutionCount] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buttonColor, setButtonColor] = useState('grey');
  const [totalBalance, setTotalBalance] = useState(0.0);
  const [availableBalance, setAvailableBalance] = useState(0.0);
  const [stakedBalance, setStakedBalance] = useState(0.0);
  const [lockedBalance, setLockedBalance] = useState(0.0);
  const [rewardsBalance, setRewardsBalance] = useState(0.0);
  const [roe, setRoe] = useState(0.5);
  const [srps, setSrps] = useState(0);
  const [pendingFioRequests, setPendingFioRequests] = useState();
  const [pendingFioRequestsLink, setPendingFioRequestsLink] = useState('');
  const [sentFioRequests, setSentFioRequests] = useState();
  const [sentFioRequestsLink, setSentFioRequestsLink] = useState('');
  const [actor, setActor] = useState();
  const [fioFee, setFioFee] = useState(0);


  const {
    connectAccount,
    deleteAccount,
    navigation: { navigate, goBack },
    route: {
      params: { account: fioAccount },
    },
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  const blockchains = ['EOS','TLOS','FIO','XLM','ALGO','ETH'];

  // Stake chart data:
  const stakeData = [
    {
      name: 'Available',
      balance: parseFloat(availableBalance),
      color: 'rgba(42, 254, 106, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Staked',
      balance: parseFloat(stakedBalance),
      color: 'rgba(254, 142, 42, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Locked',
      balance: parseFloat(lockedBalance),
      color: 'rgba(205, 227, 255, 1)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Rewards',
      balance: parseFloat(rewardsBalance),
      color: 'rgb(113, 175, 255)',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }
  ];

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

  const fioDivider = 1000000000;
  const privateKey = fioAccount.privateKey;
  const fioKey = Ecc.privateToPublic(privateKey);
  const fioEndpoint = getEndpoint('FIO');

  const name = "FIO:" + fioAccount.address;
  var usdValue = 0;
  for (const elem of totals) {
    if(elem.account===name) {
      usdValue = elem.total;
      break;
    }
  }

  const checkRegistration = async pubkey => {
    if (executionCount > 0) {
      return;
    }
    setExecutionCount(1);
    fetch(fioEndpoint + '/v1/chain/get_fio_names', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_public_key: pubkey,
      }),
    })
      .then(response => response.json())
      .then(json => updateFioRegistration(json))
      .catch(error =>
        log({
          description:
            'checkRegistration - fetch ' +
            fioEndpoint +
            '/v1/chain/get_fio_names',
          cause: error,
          location: 'FIOAddressActionsScreen',
        }),
      );
  };

  const getPendingFioRequests = async pubkey => {
    fetch(fioEndpoint + '/v1/chain/get_pending_fio_requests', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_public_key: pubkey,
        limit: 1000,
        offset: 0,
      }),
    })
      .then(response => response.json())
      .then(json => updatePendingFioRequests(json.requests))
      .catch(error =>
        log({
          description:
            'getPendingFioRequests - fetch ' +
            fioEndpoint +
            '/v1/chain/get_pending_fio_requests',
          cause: error,
          location: 'FIOAddressActionsScreen',
        }),
      );
  };

  const getSentFioRequests = async pubkey => {
    fetch(fioEndpoint + '/v1/chain/get_sent_fio_requests', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_public_key: pubkey,
        limit: 1000,
        offset: 0,
      }),
    })
      .then(response => response.json())
      .then(json => updateSentFioRequests(json.requests))
      .catch(error =>
        log({
          description:
            'getSentFioRequests - fetch ' +
            fioEndpoint +
            '/v1/chain/get_sent_fio_requests',
          cause: error,
          location: 'FIOAddressActionsScreen',
        }),
      );
  };

  const getFioBalance = async pubkey => {
    console.log(fioEndpoint + '/v1/chain/get_fio_balance');
    fetch(fioEndpoint + '/v1/chain/get_fio_balance', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fio_public_key: pubkey,
      }),
    })
      .then(response => response.json())
      .then(json => {
          //json: {"available": 47818352529, "balance": 47818352529, "roe": "0.500000000000000", "srps": 0, "staked": 0}
          try {
            console.log("getFioBalance", json);
            let tBalance = json.balance !== undefined ? (parseFloat(json.balance) / fioDivider).toFixed(4) : 0;
            if(tBalance > 0) setTotalBalance(tBalance);
            let aBalance = json.available !== undefined ? (parseFloat(json.available) / fioDivider).toFixed(4) : 0;
            if(aBalance > 0) setAvailableBalance(aBalance);
            let sBalance = json.staked !== undefined ? (parseFloat(json.staked) / fioDivider).toFixed(4) : 0;
            if(sBalance > 0) setStakedBalance(sBalance);
            var lBalance = parseFloat(tBalance) - parseFloat(aBalance) - parseFloat(sBalance);
            lBalance = (lBalance > 0) ? lBalance.toFixed(4) : 0;
            if(lBalance > 0) setLockedBalance(lBalance);
            let roeNum = json.roe !== undefined ? parseFloat(json.roe).toFixed(4) : 0.5;
            setRoe(roeNum);
            let srpsNum = json.srps !== undefined ? (parseFloat(json.srps) / fioDivider).toFixed(4) : 0;
            setSrps(srpsNum);
            let stakeRewards = parseFloat((roeNum*srpsNum) - sBalance).toFixed(4);
            if(stakeRewards > 0) setRewardsBalance(stakeRewards);
          } catch(err) {
            log("Failed to parse JSON balances " + json + ", Error: " + err);
          }
        }
      )
      .catch(error =>
        log({
          description:
            'getFioBalance - fetch ' +
            fioEndpoint +
            '/v1/chain/get_fio_balance',
          cause: error,
          location: 'FIOAddressActionsScreen',
        }),
      );
  };

  const getFee = async address => {
    fetch(fioEndpoint + '/v1/chain/get_fee', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        end_point: 'add_pub_address',
        fio_address: address,
      }),
    })
      .then(response => response.json())
      .then(json => setFioFee(json.fee))
      .catch(error =>
        log({
          description: 'getFee - fetch ' + fioEndpoint + '/v1/chain/get_fee',
          cause: error,
          location: 'FIOAddressActionsScreen',
        }),
      );
  };

  const updatePendingFioRequests = requests => {
    if (requests) {
      setPendingFioRequests(requests);
      setPendingFioRequestsLink(
        'View ' + requests.length + ' pending FIO requests',
      );
    }
  };

  const updateSentFioRequests = requests => {
    if (requests) {
      setSentFioRequests(requests);
      setSentFioRequestsLink('View ' + requests.length + ' sent FIO requests');
    }
  };

  const registerFioAddress = () => {
    Linking.openURL('https://reg.fioprotocol.io/ref/tribe?publicKey=' + fioKey);
  };

  const replacePendingFioAddress = fioAddress => {
    // Delete old pending FIO account:
    const index = findIndex(
      accounts,
      el =>
        el.address === fioAccount.address &&
        el.chainName === fioAccount.chainName,
    );
    deleteAccount(index);
    // Connect new FIO account:
    let account = {
      address: fioAddress,
      privateKey: privateKey,
      chainName: 'FIO',
    };
    connectAccount(account);
    fioAccount.address = fioAddress;
  };

  const updateFioRegistration = json => {
    let fioAddresses = json.fio_addresses;
    setLoading(true);
    if (fioAddresses) {
      fioAddresses.map(function(item) {
        if (fioAccount.address !== item.fio_address) {
          if (fioAccount.address === 'pending@tribe') {
            replacePendingFioAddress(item.fio_address);
          } 
        }
        setFioExpirationDate(item.expiration);
        return;
      });
      setRegistered(true);
      setButtonColor('primary');
      getFioBalance(fioKey);
      getFee(fioAccount.address);
      getPendingFioRequests(fioKey);
      getSentFioRequests(fioKey);
      setActor(Fio.accountHash(fioKey));
      setLoading(false);
    } else {
      Alert.alert(json.message);
      setRegistered(false);
      setButtonColor('gray');
      setFioRegistrationContent('Unregistered address');
      setRegistrationLink(
        <KButton
          title={'Register this address'}
          theme={'brown'}
          style={styles.button}
          icon={'add'}
          onPress={registerFioAddress}
        />,
      );
    }
    setLoading(false);
  };

  const _handleDeleteAccount = index => {
    deleteAccount(index);
    goBack();
  };

  const _handleRemoveAccount = () => {
    const index = findIndex(
      accounts,
      el =>
        el.address === fioAccount.address &&
        el.chainName === fioAccount.chainName,
    );
    Alert.alert(
      'Delete FIO Account',
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
    const account = fioAccount;
    navigate('PrivateKeyBackup', { account });
  };

  const _handleFIORequest = () => {
    navigate('FIORequest');
  };

  const _handleFIOSend = () => {
    navigate('FIOSend');
  };

  const _handleFIOStake = () => {
    navigate('FIOStake', { fioAccount, totalBalance, availableBalance, stakedBalance, lockedBalance, rewardsBalance });
  };

  const _handleShowPendingRequests = () => {
    if (pendingFioRequests.length > 1) {
      const fioRequests = pendingFioRequests;
      const title = 'Pending FIO requests';
      navigate('ListFIORequests', { fioAccount, fioRequests, title });
    } else {
      const fioRequest = pendingFioRequests[0];
      const title = 'Pending FIO request';
      navigate('ViewFIORequest', { fioAccount, fioRequest, title });
    }
  };

  const _handleShowSentRequests = () => {
    if (sentFioRequests.length > 1) {
      const fioRequests = sentFioRequests;
      const title = 'Sent FIO requests';
      navigate('ListFIORequests', { fioAccount, fioRequests, title });
    } else {
      const fioRequest = sentFioRequests[0];
      const title = 'Sent FIO request';
      navigate('ViewFIORequest', { fioAccount, fioRequest, title });
    }
  };

  const _loadFIORegistry = () => {
    navigate('FIOAddressRegistry', { fioAccount });
  };

  const goToRenewFIOScreen = json => {
    navigate('RenewFIOAddress', { json, fioAccount });
  };

  const _handleRenewFIOAddress = () => {
    const fioPublicKey = Ecc.privateToPublic(fioAccount.privateKey);
    fetch('https://reg.fioprotocol.io/public-api/renew', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referralCode: 'tribe',
        publicKey: fioPublicKey,
        address: fioAccount.address,
      }),
    })
      .then(response => response.json())
      .then(json => goToRenewFIOScreen(json))
      .catch(error =>
        log({
          description:
            '_handleRenewFIOAddress - fetch https://reg.fioprotocol.io/public-api/renew',
          cause: error,
          location: 'FIOAddressActionsScreen',
        }),
      );
  };

  if (executionCount === 0) {
    checkRegistration(fioKey);
  }


  const getFioRegistrationContent = () => {
    if(fioRegistrationContent) {
      return (<KText>{fioRegistrationContent}</KText>);
    } else {
      return null;
    }
  }

  const getPendingFioRequestsLink = () => {
    if(pendingFioRequestsLink) {
      return (
        <Text style={styles.link} onPress={_handleShowPendingRequests}>
          {pendingFioRequestsLink}
        </Text>
      );
    } else {
      return null;
    }
  }

  const getSentFioRequestsLink = () => {
    if(sentFioRequestsLink) {
      return (
        <Text style={styles.link} onPress={_handleShowSentRequests}>
          {sentFioRequestsLink}
        </Text>
      );
    } else {
      return null;
    }
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <MaterialIcon
            name={'keyboard-backspace'}
            size={35}
            color={PRIMARY_BLUE}
          />
        </TouchableOpacity>
        <View style={styles.rowContainer}>
         <Image
          source={require('../../../assets/chains/fio.png')}
          style={styles.buttonIcon}
         />
         <KHeader title={fioAccount.address} style={styles.header} />
        </View>
        <KText>USD Value: ${usdValue}</KText>
        <KText>Actor: {actor}</KText>
        <KText>Available: {availableBalance} FIO</KText>
        <KText>Staked: {stakedBalance} FIO</KText>
        <KText>Locked: {lockedBalance} FIO</KText>
        <KText>Rewards: {rewardsBalance} FIO</KText>
        <PieChart
          data={stakeData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          accessor="balance"
          backgroundColor="transparent"
          absolute
        />
        <View style={styles.spacer} />
        <Text style={styles.link} onPress={_handleFIOStake}>Stake FIO for rewards!</Text>
        {getFioRegistrationContent()}
        {getPendingFioRequestsLink()}
        {getSentFioRequestsLink()}
        <Text style={styles.link} onPress={_loadFIORegistry}>View linked addresses</Text>
        <FlatList/>
        <FiveIconsButtons
          onIcon1Press={_handleFIOStake}
          onIcon2Press={_handleFIORequest}
          onIcon3Press={_handleFIOSend}
          onIcon4Press={_handleBackupKey}
          onIcon5Press={_handleRemoveAccount}
          icon1={() => (
            <Image
              source={require('../../../assets/icons/stake.png')}
              style={styles.buttonIcon}
            />
          )}
          icon2={() => (
            <Image
              source={require('../../../assets/icons/fio_request.png')}
              style={styles.buttonIcon}
            />
          )}
          icon3={() => (
            <Image
              source={require('../../../assets/icons/fio_send.png')}
              style={styles.buttonIcon}
            />
          )}
          icon4={() => (
            <Image
              source={require('../../../assets/icons/save_key.png')}
              style={styles.buttonIcon}
            />
          )}
          icon5={() => (
            <Image
              source={require('../../../assets/icons/delete.png')}
              style={styles.buttonIcon}
            />
          )}
        />
        {registrationLink}
      </View>
    </SafeAreaView>
  );
};

export default connectAccounts()(FIOAddressActionsScreen);
