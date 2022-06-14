const externalChains = [
  {
    chain_code: 'BTC',
    token_code: 'BTC',
    explorer: 'https://btc.com/',
  },
  {
    chain_code: 'BNB',
    token_code: 'BNB',
    explorer: 'https://bscscan.com/address/',
  },
  {
    chain_code: 'AURORA',
    token_code: 'AURORA',
    explorer: 'https://aurorascan.dev/address/',
  },
  {
    chain_code: 'MATIC',
    token_code: 'MATIC',
    explorer: 'https://polygonscan.com/address/',
  },
  {
    chain_code: 'ETH',
    token_code: 'ETH',
    explorer: 'https://etherscan.io/address/',
  },
  {
    chain_code: 'BCH',
    token_code: 'BCH',
    explorer: 'https://explorer.bitcoin.com/bch/address/',
  },
  {
    chain_code: 'LTC',
    token_code: 'LTC',
    explorer: 'https://live.blockcypher.com/ltc/address/',
  },
];

const getExternalChain = chainName => {
  return externalChains.find(item => item.chain_code === chainName);
};

export { externalChains, getExternalChain };
