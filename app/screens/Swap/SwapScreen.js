import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { SafeAreaView, View } from 'react-native';

import styles from './SwapScreen.style';
import { KButton, KHeader, KInput, KSelect } from '../../components';
import { connectAccounts } from '../../redux';

import TokenSelectModal from './components/TokenSelectModal';
import ethereumTokens from '../../ethereum/ethereum-tokens.json';
import KIconButton from '../../components/KIconButton';
import KIcon from '../../components/KIcon';
import web3CustomModule from '../../ethereum/ethereum';

const tokenABI = require('../../ethereum/abi/tokenAbi.json');
const tokenItems = ethereumTokens.tokens;

const stableCoins = [
  {
    name: 'Ether',
    address: '',
    symbol: 'ETH',
    decimals: 18,
    chainId: 1,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  {
    name: 'Tether USD',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    decimals: 6,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
  },
  {
    name: 'USDCoin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
  {
    name: 'Dai Stablecoin',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    decimals: 18,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  },
];

const SwapScreen = props => {
  const {
    accountsState: { accounts, tokens: tokensInStore },
    addToken,
  } = props;

  const tokens = useMemo(() => {
    return [...tokenItems, ...tokensInStore];
  }, [tokensInStore]);

  const { swapToken, getAmountOut } = web3CustomModule({
    tokenABI,
    tokenAddress: null,
    decimals: 18,
  });

  const [state, setState] = useState({
    network: null,
    wallet: null,
    slipping: '',
    fromAmount: '0',
    fromToken: {
      name: 'Ether',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      symbol: 'ETH',
      decimals: 18,
      chainId: 1,
      logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    },
    toAmount: '0',
    toToken: null,
  });
  const [inputedAmount, setInputedAmount] = useState('0');

  const [networks, setNetworks] = useState([]);
  const [wallets, setWallets] = useState([]);

  const [selectedTokenType, setSelectedTokenType] = useState('from');
  const [modalVisible, setModalVisible] = useState(false);
  const [amountInputtarget, setAmountInputTarget] = useState('');

  useEffect(() => {
    let networkArray = [];
    let walletArray = [];

    accounts
      .filter(cell => cell.chainName === 'ETH')
      .map(cell => {
        networkArray.push({ label: cell.chainName, value: cell.chainName });
        walletArray.push({ label: cell.address, value: cell.address });
      });

    setNetworks(networkArray);
    setWallets(walletArray);
    let updateState = {};
    if (networkArray.length > 0 && state.network === null) {
      updateState.network = networkArray[0].value;
    }
    if (walletArray.length > 0 && state.wallet === null) {
      updateState.wallet = walletArray[0].value;
    }
    setState(prev => ({ ...prev, ...updateState }));
  }, [accounts]);

  const getOutAmount = async (
    network,
    fromToken,
    toToken,
    fromAmount = '0',
  ) => {
    let toAmount = '0';
    if (fromToken?.symbol && toToken?.symbol) {
      if (!isNaN(fromAmount) && Number(fromAmount) !== 0) {
        toAmount = await getAmountOut(network, fromToken, toToken, fromAmount);
      }
    }

    return `${toAmount}`;
  };

  const handleNetWorkChange = useCallback(itemValue => {
    setState(prev => ({ ...prev, network: itemValue }));
  }, []);

  const handleWalletChange = useCallback(itemValue => {
    setState(prev => ({ ...prev, wallet: itemValue }));
  }, []);

  const handleSlippingChange = useCallback(text => {
    setState(prev => ({ ...prev, slipping: text }));
  }, []);

  const handleFromAmountChange = useCallback(text => {
    setState(prev => ({ ...prev, fromAmount: text }));
    setAmountInputTarget('from');
    setInputedAmount(text);
  }, []);

  const handleToAmountChange = useCallback(text => {
    setState(prev => ({ ...prev, toAmount: text }));
    setAmountInputTarget('to');
    setInputedAmount(text);
  }, []);

  const handleFromTokenSelect = useCallback(() => {
    setModalVisible(true);
    setSelectedTokenType('from');
  }, []);

  const handleToTokenSelect = useCallback(() => {
    setModalVisible(true);
    setSelectedTokenType('to');
  }, []);

  const handleSwap = useCallback(() => {
    // TODO: swap function
  }, []);

  const handleClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleSwitch = () => {
    setState(prev => {
      const newState = {
        ...prev,
        fromToken: prev.toToken,
        toToken: prev.fromToken,
      };

      if (amountInputtarget === 'from') {
        newState.toAmount = prev.fromAmount;
        newState.fromAmount = '0';
        setAmountInputTarget('to');
      } else if (amountInputtarget === 'to') {
        newState.fromAmount = prev.toAmount;
        newState.toAmount = '0';
        setAmountInputTarget('from');
      }
      return newState;
    });
  };

  const handleTokenSelect = useCallback(
    tokenItem => {
      setState(prev => {
        let newState = { ...prev };
        if (selectedTokenType === 'from') {
          if (prev.toToken?.symbol === tokenItem.symbol) {
            newState.toToken = prev.fromToken;
          }
          newState.fromToken = tokenItem;
        } else {
          if (prev.fromToken?.symbol === tokenItem.symbol) {
            newState.fromToken = prev.toToken;
          }
          newState.toToken = tokenItem;
        }
        return newState;
      });
    },
    [selectedTokenType],
  );

  useEffect(() => {
    if (amountInputtarget === '') {
      return;
    }
    let fromToken = state.fromToken;
    let toToken = state.toToken;
    if (amountInputtarget === 'to') {
      fromToken = state.toToken;
      toToken = state.fromToken;
    }

    getOutAmount(state.network, fromToken, toToken, inputedAmount).then(
      outAmount => {
        let toAmount = `${outAmount}`;
        console.log({ outAmount, inputedAmount });
        if (amountInputtarget === 'from') {
          setState(prev => ({ ...prev, toAmount }));
        } else if (amountInputtarget === 'to') {
          setState(prev => ({ ...prev, fromAmount: toAmount }));
        }
      },
    );
  }, [
    amountInputtarget,
    state.network,
    state.fromToken,
    state.toToken,
    inputedAmount,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <KHeader title={'Swap'} style={styles.header} />
        <KSelect
          label={'Blockchain'}
          items={networks}
          onValueChange={handleNetWorkChange}
          containerStyle={styles.kInputContainer}
          value={state.network}
        />
        <KSelect
          label={'Wallet'}
          items={wallets}
          onValueChange={handleWalletChange}
          containerStyle={styles.kInputContainer}
          value={state.wallet}
        />
        <View style={styles.slippingContainer}>
          <KInput
            label={'Slippage tolerance'}
            placeholder={'0.10'}
            value={state.slipping}
            onChangeText={handleSlippingChange}
            selectTextOnFocus
            containerStyle={styles.inputContainer}
            style={styles.slipInput}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
            textAlign="right"
          />
          <KIcon name="percent" size={20} color={'gray'} />
        </View>
        <View style={styles.tokenContainer}>
          <KInput
            label={''}
            placeholder={'From'}
            value={state.fromAmount}
            onChangeText={handleFromAmountChange}
            selectTextOnFocus
            containerStyle={styles.inputContainer}
            style={styles.Kinput}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KButton
            title={state.fromToken?.symbol || 'Select Token'}
            onPress={handleFromTokenSelect}
            style={[styles.button]}
            textStyle={state.fromToken ? {} : styles.placeholder}
          />
        </View>
        <View style={styles.switchIconContainer}>
          <KIconButton
            style={styles.switchButton}
            onPress={handleSwitch}
            name="swap-vertical-circle-outline"
            size={30}
          />
        </View>

        <View style={styles.tokenContainer}>
          <KInput
            label={''}
            placeholder={'To'}
            value={state.toAmount}
            onChangeText={handleToAmountChange}
            selectTextOnFocus
            containerStyle={styles.inputContainer}
            style={styles.Kinput}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KButton
            title={state.toToken?.symbol || 'Select Token'}
            onPress={handleToTokenSelect}
            style={styles.button}
            textStyle={state.toToken ? {} : styles.placeholder}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <KButton
          title="Approve"
          onPress={handleSwap}
          style={styles.swapButton}
        />
        <KButton title="Swap" onPress={handleSwap} style={styles.swapButton} />
      </View>

      <TokenSelectModal
        visible={modalVisible}
        onClose={handleClose}
        onChange={handleTokenSelect}
        stableCoins={stableCoins}
        tokenItems={tokens}
        addToken={addToken}
      />
    </SafeAreaView>
  );
};

export default connectAccounts()(SwapScreen);
