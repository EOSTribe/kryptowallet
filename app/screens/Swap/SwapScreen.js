import React, { useCallback, useEffect, useState } from 'react';

import { SafeAreaView, View } from 'react-native';

import styles from './SwapScreen.style';
import { KButton, KHeader, KInput, KSelect } from '../../components';
import { connectAccounts } from '../../redux';

import TokenSelectModal from './components/TokenSelectModal';
import ethereumTokens from '../../ethereum/ethereum-tokens.json';
import KIconButton from '../../components/KIconButton';

const tokenItems = ethereumTokens.tokens;

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

  console.log('>>>>>>>>>>>>>>>accounts:', accounts);
  const [state, setState] = useState({
    network: '',
    wallet: '',
    slipping: '',
    fromAmount: 0,
    fromToken: 'ETH',
    toAmount: 0,
    toToken: 'ETH',
  });

  const [networks, setNetworks] = useState([]);
  const [wallets, setWallets] = useState([]);

  const [selectedTokenType, setSelectedTokenType] = useState('from');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTokens, setSearchTokens] = useState(tokenItems);
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
  }, [accounts]);

  useEffect(() => {
    setSearchTokens(tokenItems);
  }, [modalVisible]);

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

  const handleSwitch = useCallback(() => {
    console.log('ok');
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
  const handleSearch = term => {
    if (term === '') return setSearchTokens(tokenItems);
    const searchResult = tokenItems.filter(item => {
      return item.name.toLowerCase().includes(term.toLowerCase());
    });
    setSearchTokens(searchResult);
    if (searchResult.length === 0 && term !== '') {
      const searchAddressResult = tokenItems.filter(item => {
        return item.address.toLowerCase() === term.toAmount();
      });
      setSearchTokens(searchAddressResult);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <KHeader title={'Swap'} style={styles.header} />
        <KSelect
          label={'Blockchain'}
          items={networks}
          onValueChange={handleNetWorkChange}
          containerStyle={styles.kInputContainer}
          // style={styles.Kinput}
        />
        <KSelect
          label={'Wallet'}
          items={wallets}
          onValueChange={handleWalletChange}
          containerStyle={styles.kInputContainer}
          // style={styles.Kinput}
        />
        <View style={styles.slippingContainer}>
          <KInput
            label={'Slipping'}
            placeholder={'Enter slipping value'}
            value={state.slipping}
            onChangeText={handleSlippingChange}
            containerStyle={styles.inputContainer}
            style={styles.Kinput}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
        </View>
        <View style={styles.tokenContainer}>
          <KInput
            label={''}
            placeholder={'From'}
            value={state.slipping}
            onChangeText={handleFromAmountChange}
            containerStyle={styles.inputContainer}
            style={styles.Kinput}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KButton
            title={state.fromToken}
            onPress={handleFromTokenSelect}
            style={styles.button}
          />
        </View>
        <View style={styles.switchIconContainer}>
          <KIconButton style={styles.switchButton} onChange={handleSwitch} />
        </View>

        <View style={styles.tokenContainer}>
          <KInput
            label={''}
            placeholder={'To'}
            value={state.slipping}
            onChangeText={handleToAmountChange}
            containerStyle={styles.inputContainer}
            style={styles.Kinput}
            autoCapitalize={'none'}
            keyboardType={'numeric'}
          />
          <KButton
            title={state.toToken}
            onPress={handleToTokenSelect}
            style={styles.button}
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
        tokenItems={searchTokens}
        handleSearch={handleSearch}
      />
    </SafeAreaView>
  );
};

export default connectAccounts()(SwapScreen);
