import React, { useCallback, useEffect, useState } from 'react';

import {
  SafeAreaView,
  View,
  TouchableOpacity,
  TextInput,
  Text,
} from 'react-native';

import styles from './SwapScreen.style';
import { KButton } from '../../components';
import { connectAccounts } from '../../redux';

import AdvancedSelect from './components/AdvancedSelect';
import SlippingInput from './components/SlippingInput';
import TokenSelectModal from './components/TokenSelectModal';

const tokenItems = [
  {
    chainId: 1,
    address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
    name: '0x Protocol Token',
    symbol: 'ZRX',
    decimals: 18,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/asset_ZRX.svg',
  },
  {
    chainId: 1,
    address: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    name: 'Compound USD Coin',
    symbol: 'cUSDC',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_usdc.svg',
  },
  {
    chainId: 1,
    address: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
    name: 'Compound Dai',
    symbol: 'cDAI',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_dai.svg',
  },
  {
    chainId: 1,
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/asset_DAI.svg',
  },
  {
    chainId: 1,
    address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
    name: 'Sai Stablecoin v1.0',
    symbol: 'SAI',
    decimals: 18,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/asset_SAI.svg',
  },
  {
    chainId: 1,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/asset_USDT.svg',
  },
  {
    chainId: 1,
    address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    name: 'Compound',
    symbol: 'COMP',
    decimals: 18,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/asset_COMP.svg',
  },
  {
    chainId: 1,
    address: '0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4',
    name: 'Compound Collateral',
    symbol: 'cCOMP',
    decimals: 8,
  },
  {
    chainId: 1,
    address: '0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9',
    name: 'Compound USDT',
    symbol: 'cUSDT',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_usdt.svg',
  },
  {
    chainId: 1,
    address: '0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E',
    name: 'Compound Basic Attention Token',
    symbol: 'cBAT',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_bat.svg',
  },
  {
    chainId: 1,
    address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
    name: 'Basic Attention Token',
    symbol: 'BAT',
    decimals: 18,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/asset_BAT.svg',
  },
  {
    chainId: 1,
    address: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    name: 'Compound Ether',
    symbol: 'cETH',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_eth.svg',
  },
  {
    chainId: 1,
    address: '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC',
    name: 'Compound Sai',
    symbol: 'cSAI',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_sai.svg',
  },
  {
    chainId: 1,
    address: '0x158079Ee67Fce2f58472A96584A73C7Ab9AC95c1',
    name: 'Compound Augur',
    symbol: 'cREP',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_rep.svg',
  },
  {
    chainId: 1,
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
  },
  {
    chainId: 1,
    address: '0x1985365e9f78359a9B6AD760e32412f4a445E862',
    name: 'Reputation',
    symbol: 'REP',
    decimals: 18,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/asset_REP.svg',
  },
  {
    chainId: 1,
    address: '0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407',
    name: 'Compound 0x',
    symbol: 'cZRX',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_zrx.svg',
  },
];

const stableCoins = [
  {
    chainId: 1,
    address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
    name: '0x Protocol Token',
    symbol: 'ZRX',
    decimals: 18,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/asset_ZRX.svg',
  },
  {
    chainId: 1,
    address: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    name: 'Compound USD Coin',
    symbol: 'cUSDC',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_usdc.svg',
  },
  {
    chainId: 1,
    address: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
    name: 'Compound Dai',
    symbol: 'cDAI',
    decimals: 8,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/ctoken_dai.svg',
  },
  {
    chainId: 1,
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    logoURI:
      'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/asset_DAI.svg',
  },
];

const SwapScreen = props => {
  const {
    accountsState: { accounts, addresses, keys, totals, history, config },
  } = props;

  console.log(">>>>>>>>>>>>>>>accounts:", accounts)
  const [state, setState] = useState({
    network: '',
    wallet: '',
    slipping: '',
    fromAmount: 0,
    fromToken: 'Select Token',
    toAmount: 0,
    toToken: 'Select Token',
  });

  const [networks, setNetworks] = useState([]);
  const [wallets, setWallets] = useState([]);

  const [selectedTokenType, setSelectedTokenType] = useState('from');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let networkArray = [];
    let walletArray = [];

    accounts.filter(cell => cell.chainName === 'ETH').map((cell) => {
      networkArray.push({ label: cell.chainName, value: cell.chainName });
      walletArray.push({ label: cell.address, value: cell.address })
    });

    setNetworks(networkArray);
    setWallets(walletArray);
  }, [accounts])

  const handleNetWorkChange = useCallback(itemValue => {
    setState(prev => ({ ...prev, network: itemValue }));
  }, []);

  const handleWalletChange = useCallback(itemValue => {
    setState(prev => ({ ...prev, wallet: itemValue }));
  }, []);

  const handleSlippingChange = useCallback(e => {
    setState(prev => ({ ...prev, slipping: e.target.value }));
  }, []);

  const handleFromAmountChange = useCallback(e => {
    setState(prev => ({ ...prev, fromAmount: e.target.value }));
  }, []);

  const handleToAmountChange = useCallback(e => {
    setState(prev => ({ ...prev, toAmount: e.target.value }));
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

  const handleTokenSelect = useCallback(
    tokenItem => {
      setState(prev => {
        let newState = { ...prev };
        if (selectedTokenType === 'from') {
          newState.fromToken = tokenItem.symbol;
        } else {
          newState.toToken = tokenItem.symbol;
        }
        return newState;
      });
    },
    [selectedTokenType],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <View style={styles.netWorkContainer}>
          <AdvancedSelect
            label={'NetWork'}
            value={state.network}
            items={networks}
            onChange={handleNetWorkChange}
            containerStyle={styles.inputContainer}
          />
        </View>
        <View style={styles.walletContainer}>
          <AdvancedSelect
            label={'Wallet'}
            value={state.wallet}
            items={wallets}
            onChange={handleWalletChange}
            containerStyle={styles.inputContainer}
          />
        </View>
        <View style={styles.slippingContainer}>
          <SlippingInput
            value={state.slipping}
            onChange={handleSlippingChange}
            label={'Slipping'}
          />
        </View>
        <View style={styles.fromContainer}>
          <TextInput
            placeholder="From Amount"
            value={state.fromAmount}
            onChange={handleFromAmountChange}
            style={styles.input}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleFromTokenSelect}>
            <Text style={styles.text}>{state.fromToken}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toContainer}>
          <TextInput
            placeholder="To Amount"
            value={state.toAmount}
            onChange={handleToAmountChange}
            style={styles.input}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <TouchableOpacity style={styles.button} onPress={handleToTokenSelect}>
            <Text style={styles.text}>{state.toToken}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <KButton title="Approve" onPress={handleSwap} />
      </View>

      <TokenSelectModal
        visible={modalVisible}
        onClose={handleClose}
        onChange={handleTokenSelect}
        stableCoins={stableCoins}
        tokenItems={tokenItems}
      />
    </SafeAreaView>
  );
};

export default connectAccounts()(SwapScreen);
