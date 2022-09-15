import etherTokenList from './ethereum-tokens.json';
import bscTokenList from './bsc-tokens.json';
import polygonTokenList from './polygon-tokens.json';
import auroraTokenList from './aurora-tokens.json';

const STABLE_LENGTH = 4;

const getEVMTokens = chainName => {
  var chainTokens = [];
  switch (chainName) {
    case 'ETH':
      chainTokens = etherTokenList.tokens.slice(0, STABLE_LENGTH + 1)
      break;
    case 'BNB':
      chainTokens = bscTokenList.tokens.slice(0, STABLE_LENGTH)
      break;
    case 'MATIC':
      chainTokens = polygonTokenList.tokens.slice(0, STABLE_LENGTH)
      break;
    case 'AURORA':
      chainTokens = auroraTokenList.tokens.slice(0, STABLE_LENGTH + 5)
      break;
    case 'TELOSEVM':
      break;
    default:
      chainTokens = etherTokenList.tokens.slice(0, STABLE_LENGTH)
  }
  return chainTokens;
};

const getEVMTokenByName = (chainName, tokenName) => {
  return getEVMTokens(chainName).find(item => item.symbol === tokenName);
};

export { getEVMTokens, getEVMTokenByName };
