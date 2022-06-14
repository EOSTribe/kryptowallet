import React, { useState } from 'react';
import { Image, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import CheckBox from 'react-native-check-box';
import { KText } from '../../../components';
import { getChain, getEndpoint } from '../../../eos/chains';
import { getBalance, getTokens } from '../../../eos/tokens';
import { getAccount } from '../../../eos/eos';
import { loadAccount } from '../../../stellar/stellar';
import { getAlgoAccountInfo } from '../../../algo/algo';
import { log } from '../../../logger/logger';
import web3Module from '../../../ethereum/ethereum';
import {
  PRIMARY_GRAY,
  PRIMARY_BLACK,
  PRIMARY_BLUE,
} from '../../../theme/colors';

const ethMultiplier = 1000000000000000000;
const tokenABI = require('../../../ethereum/abi.json');
const tokenAddress = "";
const {
  getBalanceOfAccount,
} = web3Module({
  tokenABI,
  tokenAddress,
  decimals: 18
});

const fioDivider = 1000000000;
const algoDivider = 1000000;

const fioEndpoint = getEndpoint('FIO');

const { height, width } = Dimensions.get('window');
var chainWidth = width - 150;

const loadAccountBalance = async (account, updateAccountBalance) => {
  const chain = getChain(account.chainName);
  if (!chain) {
    return;
  }
  try {
    const accountInfo = await getAccount(account.accountName, chain);
    // Calculate balance:
    var selfUnstaked = 0;
    if (accountInfo.core_liquid_balance) {
      token = accountInfo.core_liquid_balance.split(' ')[1];
      selfUnstaked = parseFloat(accountInfo.core_liquid_balance.split(' ')[0]);
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
    }
    var totalBalance = (
      selfUnstaked +
      selfCpuStaked +
      selfNetStaked +
      totRefund
    ).toFixed(4);
    updateAccountBalance(totalBalance);
  } catch (err) {
    log({
      description: 'loadAccountBalance',
      cause: err,
      location: 'AccountListItem',
    });
    return;
  }
};

const loadFioAccountBalance = async (account, updateAccountBalance) => {
  try {
    const pubkey = Ecc.privateToPublic(account.privateKey);
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
        //console.log("loadFioAccountBalance", json);
        const balance = (json.balance !== undefined) ? (parseFloat(json.balance) / fioDivider).toFixed(4) : 0;
        updateAccountBalance(balance);
      }
      )
      .catch(error =>
        log({
          description:
            'loadFioAccountBalance - fetch ' +
            fioEndpoint +
            '/v1/chain/get_fio_balance',
          cause: error,
          location: 'AccountListItem',
        }),
      );
  } catch (err) {
    log({
      description: 'loadFioAccountBalance',
      cause: err,
      location: 'AccountListItem',
    });
    return;
  }
};

const loadAlgoAccountBalance = async (account, updateAccountBalance) => {
  try {
    const addr = account.account.addr;
    const info = await getAlgoAccountInfo(addr);
    const algoBalance = (parseFloat(info.amount) / algoDivider).toFixed(4);
    updateAccountBalance(algoBalance);
  } catch (err) {
    log({
      description: 'loadAlgoAccountBalance',
      cause: err,
      location: 'AccountListItem',
    });
    return;
  }
};


const loadStellarAccountBalance = async (account, updateAccountBalance) => {
  try {
    const processStellarAccount = (json) => {
      var nativeBalance = 0;
      if (json['balances']) {
        const balances = json['balances'];
        balances.forEach(balance => {
          if (balance["asset_type"] === "native") {
            nativeBalance = balance["balance"];
          }
        });
      }
      updateAccountBalance(parseFloat(nativeBalance).toFixed(4));
    };
    loadAccount(account.address, processStellarAccount); // 'GAI3GJ2Q3B35AOZJ36C4ANE3HSS4NK7WI6DNO4ZSHRAX6NG7BMX6VJER'
  } catch (err) {
    log({
      description: 'loadStellarAccountBalance',
      cause: err,
      location: 'AccountListItem',
    });
    return;
  }
};

const loadEthereumAccountBalance = async (account, updateAccountBalance) => {
  const ethBalanceInGwei = await getBalanceOfAccount(account.chainName, account.address);
  const ethBalanceInEth = ethBalanceInGwei / ethMultiplier;
  if (updateAccountBalance) {
    updateAccountBalance(parseFloat(ethBalanceInEth).toFixed(4));
  }
};

const AccountListItem = ({ account, onPress, onTokenPress, onBalanceUpdate, ...props }) => {
  const [accountBalance, setAccountBalance] = useState();
  const [count, setCount] = useState(0);

  const updateAccountBalance = (balance) => {
    let balText = balance + ' ' + (account.chainName == 'AURORA' ? 'ETH' : account.chainName);
    setAccountBalance(balText);
    onBalanceUpdate(account, balance);
  };

  const refreshBalances = async () => {
    if (account.chainName === 'FIO') {
      loadFioAccountBalance(account, updateAccountBalance);
    } else if (account.chainName === 'ALGO') {
      loadAlgoAccountBalance(account, updateAccountBalance);
    } else if (account.chainName === 'XLM') {
      loadStellarAccountBalance(account, updateAccountBalance);
    } else if (account.chainName === 'ETH' || account.chainName === 'BNB' || account.chainName === 'MATIC' || account.chainName === 'AURORA') {
      loadEthereumAccountBalance(account, updateAccountBalance);
    } else {
      loadAccountBalance(account, updateAccountBalance);
    }
    setCount(1);
  };

  const handleOnTokensPress = index => {
    setCount(0);
    onTokenPress(index);
  };

  const handleOnPress = index => {
    setCount(0);
    refreshBalances();
    onPress(index);
  };

  if (count === 0) {
    refreshBalances();
  }

  const getChainIcon = name => {
    if (name == "BNB") {
      return require("../../../../assets/chains/bsc.png");
    } else if (name == "MATIC") {
      return require("../../../../assets/chains/polygon.png");
    } else if (name == "ETH") {
      return require("../../../../assets/chains/eth.png");
    } else if (name == "AURORA") {
      return require("../../../../assets/chains/aurora.png");
    }else if (name == "EOS") {
      return require("../../../../assets/chains/eos.png");
    } else if (name == "Telos") {
      return require("../../../../assets/chains/telos.png");
    } else if (name == "ALGO") {
      return require("../../../../assets/chains/algo.png");
    } else if (name == "FIO") {
      return require("../../../../assets/chains/fio.png");
    } else if (name == "XLM") {
      return require("../../../../assets/chains/xlm.png");
    } else {
      return "";
    }
  }

  if (account.chainName === 'FIO') {
    return (
      <View onFocus={refreshBalances} style={styles.rowContainer}>
        <View style={[styles.container, props.style]}>
          <Image source={getChainIcon(account.chainName)} style={styles.chainIcon} />
          <TouchableOpacity onPress={handleOnPress}>
            <KText style={styles.chainName}>
              {" "} {account.address}, {accountBalance}
            </KText>
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshBalances}>
            <Icon name={'refresh'} size={25} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  } else if (account.chainName === 'ALGO') {
    return (
      <View onFocus={refreshBalances} style={styles.rowContainer}>
        <View style={[styles.container, props.style]}>
          <Image source={getChainIcon(account.chainName)} style={styles.chainIcon} />
          <TouchableOpacity onPress={handleOnPress}>
            <KText style={styles.chainName}>
              {" "} {account.accountName}, {accountBalance}
            </KText>
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshBalances}>
            <Icon name={'refresh'} size={25} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  } else if (account.chainName === 'XLM') {
    return (
      <View onFocus={refreshBalances} style={styles.rowContainer}>
        <View style={[styles.container, props.style]}>
          <Image source={getChainIcon(account.chainName)} style={styles.chainIcon} />
          <TouchableOpacity onPress={handleOnPress}>
            <KText style={styles.chainName}>
              {" "} {account.address.substring(0, 12)}.., {accountBalance}
            </KText>
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshBalances}>
            <Icon name={'refresh'} size={25} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  } else if (account.chainName === 'ETH' || account.chainName === 'BNB' || account.chainName === 'MATIC' || account.chainName === 'AURORA') {
    return (
      <View>
        <View onFocus={refreshBalances} style={styles.rowContainer}>
          <View style={[styles.container, props.style]}>
            <Image source={getChainIcon(account.chainName)} style={styles.chainIcon} />
            <TouchableOpacity onPress={handleOnPress}>
              <KText style={styles.chainName}>
                {" "} {account.address.substring(0, 12)}.., {accountBalance}
              </KText>
            </TouchableOpacity>
            <TouchableOpacity onPress={refreshBalances}>
              <Icon name={'refresh'} size={25} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={handleOnTokensPress}>
          <View style={[styles.container, props.style]}>
            <View style={styles.contentContainer}>
              <KText style={styles.tokenName}> + View Tokens</KText>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  } else {
    let tokens = getTokens(account.chainName);
    if (tokens.length > 0) {
      return (
        <View>
          <View onFocus={refreshBalances} style={styles.rowContainer}>
            <View style={[styles.container, props.style]}>
              <Image source={getChainIcon(account.chainName)} style={styles.chainIcon} />
              <TouchableOpacity onPress={handleOnPress}>
                <KText style={styles.chainName}>
                  {" "} {account.accountName}, {accountBalance}
                </KText>
              </TouchableOpacity>
              <TouchableOpacity onPress={refreshBalances}>
                <Icon name={'refresh'} size={25} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={handleOnTokensPress}>
            <View style={[styles.container, props.style]}>
              <View style={styles.contentContainer}>
                <KText style={styles.tokenName}> + View Tokens</KText>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View onFocus={refreshBalances} style={styles.rowContainer}>
          <View style={[styles.container, props.style]}>
            <Image source={getChainIcon(account.chainName)} style={styles.chainIcon} />
            <TouchableOpacity onPress={handleOnPress}>
              <KText style={styles.chainName}>
                {" "} {account.accountName}, {accountBalance}
              </KText>
            </TouchableOpacity>
            <TouchableOpacity onPress={refreshBalances}>
              <Icon name={'refresh'} size={25} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }
};

const styles = StyleSheet.create({
  rowContainer: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowColor: '#2A2240',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    borderRadius: 6,
    elevation: 4,
    backgroundColor: '#F1F6FF',
    padding: 5,
  },
  contentContainer: {
    marginLeft: 10,
  },
  chainName: {
    width: chainWidth,
    fontSize: 16,
    color: PRIMARY_BLACK,
  },
  chainIcon: {
    width: 18,
    height: 18,
  },
  tokenName: {
    fontSize: 15,
    color: PRIMARY_BLUE,
  },
  accountName: {
    fontSize: 16,
    color: PRIMARY_GRAY,
  },
});

export default AccountListItem;
