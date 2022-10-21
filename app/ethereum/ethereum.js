/**
 * dependencies:
 * "web3": "^1.6.1"
 * "ethereumjs-tx": "^2.1.2",
 * "ethereumjs-util": "^7.1.3",
 */
import Web3 from 'web3';
import { toBuffer } from 'ethereumjs-util';
import { Interface } from '@ethersproject/abi'
import { Transaction as EthereumTx } from 'ethereumjs-tx';
import Common from 'ethereumjs-common';
import { BigNumber, ethers } from 'ethers';
import { getAuroraStakingLatestPrices } from '../pricing/coinmarketcap'
import { AURORA_STAKING_ADDRESS, WETH_ADDRESS, UNISWAP_ADDRESS, DEFI_ADDRESS, SIMPLE_CALLER_ADDRESS, ETH_ADDRESS, ZERO_ADDRESS } from '../constant/address';
import { isEVMNetwork } from '../external/blockchains';

const tokenABI = require('./abi/tokenAbi.json');
const nftABI = require('./abi/nftAbi.json');
const multiCallABI = require('./abi/multiCallAbi.json');
const auroraStakingABI = require('./abi/auroraStakingAbi.json');
const uniswapABI = require('./abi/uniswapAbi.json');
const routerABI = require('./abi/routerAbi.json');

const alchemyKey = 'YSn_BqGmQWnZy6O4GRtbFQpD11z121GN';

const nftAddress = '0xe5af1c8813a80d34a960e019b7eab7e0b4b1ead5';

const ethEndpoint = 'https://mainnet.infura.io/v3/2b2ef31c5ecc4c58ac7d2a995688806c';
const bscEndpoint = 'https://bsc-dataseed3.binance.org';
const polygonEndpoint = "https://polygon-rpc.com";
const auroraEndpoint = "https://mainnet.aurora.dev";
const telosEndpoint = "https://mainnet.telos.net/evm";
const ethWeb3 = new Web3(new Web3.providers.HttpProvider(ethEndpoint));
const bscWeb3 = new Web3(new Web3.providers.HttpProvider(bscEndpoint));
const polygonWeb3 = new Web3(new Web3.providers.HttpProvider(polygonEndpoint));
const auroraWeb3 = new Web3(new Web3.providers.HttpProvider(auroraEndpoint));
const telosWeb3 = new Web3(new Web3.providers.HttpProvider(telosEndpoint));

const getWeb3 = (chainName) => {
  let ret;
  switch (chainName) {
    case "ETH":
      ret = ethWeb3;
      break;
    case "BNB":
      ret = bscWeb3;
      break;
    case "MATIC":
      ret = polygonWeb3;
      break;
    case "AURORA":
      ret = auroraWeb3;
      break;
    case "TELOSEVM":
      ret = telosWeb3;
      break;
    default:
      ret = ethWeb3;
  }

  return ret;
}

const getChainId = (chainName) => {
  let ret = 1;
  switch (chainName) {
    case "ETH":
      ret = 1;
      break;
    case "BNB":
      ret = 56;
      break;
    case "MATIC":
      ret = 137;
      break;
    case "AURORA":
      ret = 1313161554;
      break;
    case "TELOSEVM":
      ret = 40;
      break;
    default:
      ret = 1;
  }

  return ret;
}

const getNodeUrl = (chainName) => {
  let ret = ethEndpoint;
  switch (chainName) {
    case "ETH":
      ret = ethEndpoint;
      break;
    case "BNB":
      ret = bscEndpoint;
      break;
    case "MATIC":
      ret = polygonEndpoint;
      break;
    case "AURORA":
      ret = auroraEndpoint;
      break;
    case "TELOSEVM":
      ret = telosEndpoint;
      break;
    default:
      ret = ethEndpoint;
  }

  return ret;
}

const getMulitCallAddress = (chainName) => {
  let ret = "0x605f4d2Ee9951180eC265d17781a51Fc46D84138";
  switch (chainName) {
    case "ETH":
      ret = "0x605f4d2Ee9951180eC265d17781a51Fc46D84138";
      break;
    case "BNB":
      ret = "0xfF6FD90A470Aaa0c1B8A54681746b07AcdFedc9B";
      break;
    case "MATIC":
      ret = "0x275617327c958bD06b5D6b871E7f491D76113dd8";
      break;
    case "AURORA":
      ret = "0x49eb1F160e167aa7bA96BdD88B6C1f2ffda5212A";
      break;
    case "TELOSEVM":
      ret = "";
      break;
    default:
      ret = ethEndpoint;
  }

  return ret;
}

export const AURORA_STREAM_NUM = 5;

/**
 * Unstoppabled Domain Module
 */
export const domanAddressModule = () => {
  const getAlchemyAPIKey = (chainName) => {
    if (isEVMNetwork(chainName))
      return alchemyKey;

    return ''
  }

  return {
    getAddress: async (chainName, domain) => {
      if (domain === '')
        return undefined;

      try {
        if (domain.slice(-4) === '.eth') { //ENS
          const options = {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            }
          };
          const res = await fetch(`https://api.ensideas.com/ens/resolve/${domain}`, options);
          const jsonData = await res.json();
          return jsonData.address;
        }

        const options = {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${getAlchemyAPIKey(chainName)}`
          }
        };
        const res = await fetch(`https://unstoppabledomains.g.alchemy.com/domains/${domain}`, options);
        const jsonData = await res.json();
        return jsonData.records["crypto.ETH.address"];
      } catch (err) {
        console.log(endpoint, err);
        return undefined;
      }
    }
  }
}

/**
 * Web3 Aurora Staking Module
 */
export const web3AuroraStakingModule = () => {
  const chainName = "AURORA"
  const web3 = auroraWeb3;
  const contract = new web3.eth.Contract(auroraStakingABI, AURORA_STAKING_ADDRESS);

  const getOneDayReward = async (streamId) => {
    const schedule = await contract.methods.getStreamSchedule(streamId).call();
    const now = Math.floor(Date.now() / 1000);
    const oneDay = 86400;
    const streamStart = parseInt(schedule[0][0]);
    const streamEnd = parseInt(schedule[0][schedule[0].length - 1]);

    if (now <= streamStart) return BigNumber.from(0) // didn't start
    if (now >= streamEnd - oneDay) return BigNumber.from(0) // ended
    const currentIndex = schedule[0].findIndex(indexTime => now < indexTime) - 1
    const indexDuration = schedule[0][currentIndex + 1] - schedule[0][currentIndex]
    const indexRewards = (BigNumber.from(schedule[1][currentIndex])).sub(schedule[1][currentIndex + 1]);
    const oneDayReward = (BigNumber.from(indexRewards)).mul(oneDay).div(indexDuration);

    return oneDayReward
  }

  return {
    /**
     * Get staking APRs
     */
    getAprs: async () => {
      try {
        const aprs = [];
        const stakingPrices = await getAuroraStakingLatestPrices();
        const totalStaked = await contract.methods.getTotalAmountOfStakedAurora().call();

        // streamTokenPrice can be queried from coingecko.
        const prices = [
          stakingPrices['AURORA'],
          stakingPrices['PLY'],
          stakingPrices['TRI'],
          stakingPrices['BSTN'],
          stakingPrices['USN'],
        ];
        const totalStakedValue = ethers.utils.formatUnits(totalStaked, 18) * prices[0];

        for (let i = 0; i < AURORA_STREAM_NUM; i++) {
          const oneDayReward = await getOneDayReward(i);
          const oneYearStreamRewardValue = ethers.utils.formatUnits(oneDayReward, 18) * 365 * prices[i];
          const streamAPR = oneYearStreamRewardValue * 100 / totalStakedValue;
          aprs.push(parseFloat(streamAPR).toFixed(2));
        }

        return aprs;
      } catch (e) {
        console.log("Get staking APRs error:", e);
        return [];
      }
    },
    /**
     * Get the pending rewards
     * @param {String} account
     */
    getPendingRewards: async (account) => {
      try {
        const pendings = [];

        let pending = await contract.methods.getUserTotalDeposit(account.address).call();
        pendings.push(parseFloat(ethers.utils.formatUnits(pending)).toFixed(5));

        for (let i = 1; i < AURORA_STREAM_NUM; i++) {
          pending = await contract.methods.getStreamClaimableAmount(i, account.address).call();
          pendings.push(parseFloat(ethers.utils.formatUnits(pending)).toFixed(5));
        }
        return pendings;
      } catch (e) {
        console.log("Get the pending rewards error:", e);
        return [0, 0, 0, 0, 0];
      }
    },
    /**
     * Get lock time for withdrawal
     * @param {String} account
     */
    getWithdrawLockTime: async (account) => {
      try {
        let lastTime = 0;
        const now = (await web3.eth.getBlock()).timestamp;
        for (let i = 0; i < AURORA_STREAM_NUM; i++) {
          const releaseTime = await contract.methods.getReleaseTime(i, account.address).call();
          if (lastTime < releaseTime) lastTime = releaseTime;
        }
        return lastTime - now;
      } catch (e) {
        console.log("Get the withdrawals lock time error:", e);
        return 1;
      }
    },
    /**
     * Get the withdrawals
     * @param {String} account
     */
    getWithdrawals: async (account) => {
      try {
        const pendings = [];
        for (let i = 0; i < AURORA_STREAM_NUM; i++) {
          const pending = await contract.methods.getPending(i, account.address).call();
          pendings.push(parseFloat(ethers.utils.formatUnits(pending)).toFixed(5));
        }
        return pendings;
      } catch (e) {
        console.log("Get the withdrawals error:", e);
        return [0, 0, 0, 0, 0];
      }
    },
    /**
     * Staking
     * @param {String} account
     * @param {Number} amount
     */
    stake: async (account, amount, gasLimit, gasPrice) => {
      try {
        const chainId = getChainId(chainName);
        const providerURL = getNodeUrl(chainName);
        const FORK_NETWORK = Common.forCustomChain(
          'mainnet',
          {
            name: chainName,
            networkId: chainId,
            chainId: chainId,
            url: providerURL,
          },
          'istanbul',
        );

        const privateKey = (account.privateKey.startsWith("0x")) ? toBuffer(`${account.privateKey}`) : toBuffer(`0x${account.privateKey}`);
        const nounce = await web3.eth.getTransactionCount(account.address);

        const stakeAmount = ethers.utils.parseUnits(amount, 18);
        const transactionData = contract.methods.stake(stakeAmount).encodeABI();

        const rawTransaction = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          value: '0x0',
          nonce: web3.utils.toHex(nounce),
          data: transactionData,
          gasLimit: web3.utils.toHex(gasLimit),
          gasPrice: web3.utils.toHex(gasPrice),
        };

        const tx = new EthereumTx(rawTransaction, { common: FORK_NETWORK });
        tx.sign(privateKey);
        const serializedTx = tx.serialize();
        return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      } catch (e) {
        console.log("Staking error:", e);
        return [];
      }
    },
    /**
     * Get staking gas limit
     * @param {String} account
     * @param {Number} amount
     */
    getStakeGasLimit: async (account, amount) => {
      try {
        const stakeAmount = ethers.utils.parseUnits(amount, 18);
        const transactionData = contract.methods.stake(stakeAmount).encodeABI();

        const tx = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          data: transactionData,
        };

        return web3.eth.estimateGas(tx);
      } catch (e) {
        console.log("Get staking gas limit error:", e);
        return 0;
      }
    },
    /**
     * Unstaking
     * @param {String} account
     * @param {Number} amount
     */
    unstake: async (account, amount, gasLimit, gasPrice) => {
      try {
        const chainId = getChainId(chainName);
        const providerURL = getNodeUrl(chainName);
        const FORK_NETWORK = Common.forCustomChain(
          'mainnet',
          {
            name: chainName,
            networkId: chainId,
            chainId: chainId,
            url: providerURL,
          },
          'istanbul',
        );

        const privateKey = (account.privateKey.startsWith("0x")) ? toBuffer(`${account.privateKey}`) : toBuffer(`0x${account.privateKey}`);
        const nounce = await web3.eth.getTransactionCount(account.address);

        const unstakeAmount = ethers.utils.parseUnits(amount, 18);
        const transactionData = contract.methods.unstake(unstakeAmount).encodeABI();

        const rawTransaction = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          value: '0x0',
          nonce: web3.utils.toHex(nounce),
          data: transactionData,
          gasLimit: web3.utils.toHex(gasLimit),
          gasPrice: web3.utils.toHex(gasPrice),
        };

        const tx = new EthereumTx(rawTransaction, { common: FORK_NETWORK });
        tx.sign(privateKey);
        const serializedTx = tx.serialize();
        return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      } catch (e) {
        console.log("Unstaking error:", e);
        return [];
      }
    },
    /**
     * Get unstaking gas limit
     * @param {String} account
     * @param {Number} amount
     */
    getUnstakeGasLimit: async (account, amount) => {
      try {
        const unstakeAmount = ethers.utils.parseUnits(amount, 18);
        const transactionData = contract.methods.unstake(unstakeAmount).encodeABI();

        const tx = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          data: transactionData,
        };

        return web3.eth.estimateGas(tx);
      } catch (e) {
        console.log("Get staking gas limit error:", e);
        return 0;
      }
    },
    /**
     * Unstaking all
     * @param {String} account
     */
    unstakeAll: async (account, gasLimit, gasPrice) => {
      try {
        const chainId = getChainId(chainName);
        const providerURL = getNodeUrl(chainName);
        const FORK_NETWORK = Common.forCustomChain(
          'mainnet',
          {
            name: chainName,
            networkId: chainId,
            chainId: chainId,
            url: providerURL,
          },
          'istanbul',
        );

        const privateKey = (account.privateKey.startsWith("0x")) ? toBuffer(`${account.privateKey}`) : toBuffer(`0x${account.privateKey}`);
        const nounce = await web3.eth.getTransactionCount(account.address);

        const transactionData = contract.methods.unstakeAll().encodeABI();

        const rawTransaction = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          value: '0x0',
          nonce: web3.utils.toHex(nounce),
          data: transactionData,
          gasLimit: web3.utils.toHex(gasLimit),
          gasPrice: web3.utils.toHex(gasPrice),
        };

        const tx = new EthereumTx(rawTransaction, { common: FORK_NETWORK });
        tx.sign(privateKey);
        const serializedTx = tx.serialize();
        return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      } catch (e) {
        console.log("Unstaking all error:", e);
        return [];
      }
    },
    /**
     * Get unstaking all gas limit
     * @param {String} account
     */
    getUnstakeAllGasLimit: async (account) => {
      try {
        const transactionData = contract.methods.unstakeAll().encodeABI();

        const tx = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          data: transactionData,
        };

        return web3.eth.estimateGas(tx);
      } catch (e) {
        console.log("Get unstaking all gas limit error:", e);
        return 0;
      }
    },
    /**
     * Claim all
     * @param {String} account
     */
    claimAll: async (account, gasLimit, gasPrice) => {
      try {
        const chainId = getChainId(chainName);
        const providerURL = getNodeUrl(chainName);
        const FORK_NETWORK = Common.forCustomChain(
          'mainnet',
          {
            name: chainName,
            networkId: chainId,
            chainId: chainId,
            url: providerURL,
          },
          'istanbul',
        );

        const privateKey = (account.privateKey.startsWith("0x")) ? toBuffer(`${account.privateKey}`) : toBuffer(`0x${account.privateKey}`);
        const nounce = await web3.eth.getTransactionCount(account.address);

        const transactionData = contract.methods.moveAllRewardsToPending().encodeABI();

        const rawTransaction = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          value: '0x0',
          nonce: web3.utils.toHex(nounce),
          data: transactionData,
          gasLimit: web3.utils.toHex(gasLimit),
          gasPrice: web3.utils.toHex(gasPrice),
        };

        const tx = new EthereumTx(rawTransaction, { common: FORK_NETWORK });
        tx.sign(privateKey);
        const serializedTx = tx.serialize();
        return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      } catch (e) {
        console.log("Claim all error:", e);
        return [];
      }
    },
    /**
     * Get claim all gas limit
     * @param {String} account
     */
    getClaimAllGasLimit: async (account) => {
      try {
        const transactionData = contract.methods.moveAllRewardsToPending().encodeABI();

        const tx = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          data: transactionData,
        };

        return web3.eth.estimateGas(tx);
      } catch (e) {
        console.log("Get claim all gas limit error:", e);
        return 0;
      }
    },
    /**
     * Withdrawal all
     * @param {String} account
     */
    withdrawAll: async (account, gasLimit, gasPrice) => {
      try {
        const chainId = getChainId(chainName);
        const providerURL = getNodeUrl(chainName);
        const FORK_NETWORK = Common.forCustomChain(
          'mainnet',
          {
            name: chainName,
            networkId: chainId,
            chainId: chainId,
            url: providerURL,
          },
          'istanbul',
        );

        const privateKey = (account.privateKey.startsWith("0x")) ? toBuffer(`${account.privateKey}`) : toBuffer(`0x${account.privateKey}`);
        const nounce = await web3.eth.getTransactionCount(account.address);

        const transactionData = contract.methods.withdrawAll().encodeABI();

        const rawTransaction = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          value: '0x0',
          nonce: web3.utils.toHex(nounce),
          data: transactionData,
          gasLimit: web3.utils.toHex(gasLimit),
          gasPrice: web3.utils.toHex(gasPrice),
        };

        const tx = new EthereumTx(rawTransaction, { common: FORK_NETWORK });
        tx.sign(privateKey);
        const serializedTx = tx.serialize();
        return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      } catch (e) {
        console.log("Withdrawal all error:", e);
        return [];
      }
    },
    /**
     * Get withdraw all gas limit
     * @param {String} account
     */
    getWithdrawAllGasLimit: async (account) => {
      try {
        const transactionData = contract.methods.withdrawAll().encodeABI();

        const tx = {
          from: account.address,
          to: AURORA_STAKING_ADDRESS,
          data: transactionData,
        };

        return web3.eth.estimateGas(tx);
      } catch (e) {
        console.log("Get withdraw all gas limit error:", e);
        return 0;
      }
    },
  }
}

/**
 * Web3 Hooks Call Module
 */
export const web3HooksModule = () => {
  return {
    /**
     * Get result of multicall
     * @param {String} chainName
     * @param {String} multiCallAddress
     */
    multicall: async (chainName, abi, calls) => {
      try {
        const web3 = getWeb3(chainName);
        const multiCallAddress = getMulitCallAddress(chainName)
        const multi = new web3.eth.Contract(multiCallABI, multiCallAddress);
        const itf = new Interface(abi)

        const calldata = calls.map((call) => ({
          target: call.address.toLowerCase(),
          callData: itf.encodeFunctionData(call.name, call.params),
        }))

        const { returnData } = await multi.methods.aggregate(calldata).call();
        const res = returnData.map((call, i) => itf.decodeFunctionResult(calls[i].name, call))
        return res;
      } catch (e) {
        console.log("multi call error:", e);
        return [];
      }
    },
  }
}

/**
 * Web3 Custom Token Module
 */
export const web3TokenInfoModule = () => {
  return {
    /**
     * Get token name
     * @param {String} chainName
     */
    getName: async (chainName, tokenAddress) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(tokenABI, tokenAddress);
      const result = await contract.methods.name().call();
      return result;
    },
    /**
     * Get symbol name
     * @param {String} chainName
     */
    getSymbol: async (chainName, tokenAddress) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(tokenABI, tokenAddress);
      const result = await contract.methods.symbol().call();
      return result;
    },
    /**
     * Get decimal
     * @param {String} chainName
     */
    getDecimals: async (chainName, tokenAddress) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(tokenABI, tokenAddress);
      const result = await contract.methods.decimals().call();
      return result;
    },
  }
}

/**
 * Web3 Custom NFT Module
 */
export const web3NFTModule = () => {
  return {
    /**
     * Get nft price
     * @param {String} chainName
     */
    getTotalSupply: async (chainName) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(nftABI, nftAddress);
      const result = await contract.methods.totalSupply().call();
      return result;
    },
    /**
     * Get nft price
     * @param {String} chainName
     */
    getNFTPrice: async (chainName) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(nftABI, nftAddress);
      const result = await contract.methods.publicCost().call();
      return result;
    },
    /**
     * Get nft avatar url
     * @param {Number} tokenId
     */
    getNFTImageURL: async (tokenId) => {
      const result = { uri: `https://ipfs.io/ipfs/QmTXBqXvN2soec7ANXnWet1SzsBDT8aCUqZv1pdgZafnBg/${tokenId}.png` };
      return result;
    },
    /**
     * Get current nft mint gas limit
     */
    getCurrentNFTMintGasLimit: async (chainName, account, count) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(nftABI, nftAddress);
      const transactionData = contract.methods.buy(count).encodeABI();
      const nftPrice = await contract.methods.publicCost().call();
      const value = nftPrice * count;

      const tx = {
        to: nftAddress,
        data: transactionData,
        from: account.address,
        value: web3.utils.toHex(value),
      };

      return web3.eth.estimateGas(tx);
    },
    /**
     * mint
     * @param {String} chainName
     * @param {Keypair} account
     * @param {Number} count
     * @param {Number} gasPrice
     */
    mintNFT: async (chainName, account, count, gasLimit = 300000, gasPrice = 20000000000) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(nftABI, nftAddress);
      const chainId = getChainId(chainName);
      const providerURL = getNodeUrl(chainName);
      const FORK_NETWORK = Common.forCustomChain(
        'mainnet',
        {
          name: chainName,
          networkId: chainId,
          chainId: chainId,
          url: providerURL,
        },
        'istanbul',
      );

      const privateKey = (account.privateKey.startsWith("0x")) ? toBuffer(`${account.privateKey}`) : toBuffer(`0x${account.privateKey}`);
      const nounce = await web3.eth.getTransactionCount(account.address);

      const transactionData = contract.methods.buy(count).encodeABI();
      const nftPrice = await contract.methods.publicCost().call();
      const value = nftPrice * count;

      const rawTransaction = {
        from: account.address,
        to: nftAddress,
        value: web3.utils.toHex(value),
        nonce: web3.utils.toHex(nounce),
        data: transactionData,
        gasLimit: web3.utils.toHex(gasLimit),
        gasPrice: web3.utils.toHex(gasPrice),
      };

      const tx = new EthereumTx(rawTransaction, { common: FORK_NETWORK });
      tx.sign(privateKey);
      const serializedTx = tx.serialize();
      return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    },
  }
}

/**
 * Web3 Custom Module
 * @param {Array} tokenABI
 * @param {String} tokenAddress
 * @param {Number} decimals
 */
const web3CustomModule = ({ tokenABI, tokenAddress, decimals }) => {
  if (!decimals) {
    decimals = 18;
  }

  const ContractInstance = (web3, abi, address) => {
    const contract = new web3.eth.Contract(abi, address);
    return contract;
  };

  const getAmountsOut = (contract_address, pair, amount) => {
    return new Promise(async resolve => {
      try {
        const contract = ContractInstance(web3, UniswapContract, contract_address)
        const result = await contract.methods
          .getAmountsOut(amount, pair)
          .call()
        resolve({
          status: true,
          data: result
        })
      } catch (e) {
        console.log(e)
        resolve({
          status: false,
          error: e
        });
      }
    });
  }

  const getBNValue = (balance, decimal) => {
    return (balance * (10 ** decimal)).toString();
  }

  const getCorrectDecValue = (balance, decimal, float, showDecimal = true) => {
    let result = 0;
    let prefix = (balance < 0);
    balance = Math.abs(balance);
    if (float === -1) {
      result = (balance / (10 ** decimal))
    }
    else {
      result = parseFloat((balance / (10 ** decimal)).toFixed(float));
    }
    if (showDecimal) {
      let str = result.toString();
      let int_str = str.split('.')[0];
      let float_str = str.split('.')[1];
      let ret_str = '';
  
      let count = 0;
      for (let i = int_str.length - 1; i >= 0; i--) {
        count++;
        ret_str = (int_str[i] + ret_str)
        if (count % 3 === 0 && i !== 0)
          ret_str = ',' + ret_str
      }
  
      if (float_str) {
        ret_str = ret_str + '.' + float_str
      }
      return prefix ? (`-` + ret_str) : ret_str;
    } else {
      return prefix ? (`-` + result) : result;
    }
  }

  return {
    /**
     * Get Keypair from privateKey
     * @param {String} privateKey
     */
    createKeyPair: async (chainName, privateKey) => {
      return getWeb3(chainName).eth.accounts.privateKeyToAccount(privateKey)
    },
    /**
     * Get current gas price
     */
    getCurrentGasPrice: async (chainName) => getWeb3(chainName).eth.getGasPrice(),
    /**
     * Get current eth gas price
     */
    getCurrentETHGasLimit: async (chainName, account, amount, toAddress) => {
      const web3 = getWeb3(chainName);
      const tx = {
        from: account.address,
        to: toAddress,
        value: web3.utils.toHex(web3.utils.toWei(amount, 'ether')),
      };

      return getWeb3(chainName).eth.estimateGas(tx);
    },
    /**
     * Get current token gas price
     */
    getCurrentTokenGasLimit: async (chainName, account, amount, toAddress) => {
      const web3 = getWeb3(chainName);
      const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress, {
        from: account.address
      });
      const realAmount = ethers.utils.parseUnits(amount, decimals);
      const transactionData = tokenContract.methods
        .transfer(toAddress, realAmount.toHexString())
        .encodeABI();

      const tx = {
        from: account.address,
        to: tokenAddress,
        data: transactionData,
      };

      return getWeb3(chainName).eth.estimateGas(tx);
    },
    /**
     * Transfer ETH from account to toAddress
     * @param {Keypair} account
     * @param {String} toAddress
     * @param {Number} amount
     * @param {Number} gasLimit
     * @param {Number} gasPrice
     */
    transferETH: async (chainName, account, toAddress, amount, gasLimit = 21000, gasPrice = 20000000000) => {
      if (toAddress === undefined || toAddress.length !== 42 || getWeb3(chainName).utils.isAddress(toAddress) === false) {
        console.error('The Ethereum address you entered is not valid!');
        return new Error('wrong address');
      }
      if (amount <= 0) {
        console.error('The amount is not valid!');
        return new Error('Wrong amount');
      }

      const chainId = getChainId(chainName);
      const providerURL = getNodeUrl(chainName);
      const FORK_NETWORK = Common.forCustomChain(
        'mainnet',
        {
          name: chainName,
          networkId: chainId,
          chainId: chainId,
          url: providerURL,
        },
        'istanbul',
      );

      const privateKey = toBuffer(account.privateKey);
      const count = await getWeb3(chainName).eth.getTransactionCount(account.address);
      const rawTransaction = {
        from: account.address,
        to: toAddress,
        value: getWeb3(chainName).utils.toHex(amount * 1000000000000000000),
        gasPrice: getWeb3(chainName).utils.toHex(gasPrice),
        gasLimit: getWeb3(chainName).utils.toHex(gasLimit),
        nonce: getWeb3(chainName).utils.toHex(count)
      };

      const tx = new EthereumTx(rawTransaction, { common: FORK_NETWORK });
      tx.sign(privateKey);
      const serializedTx = tx.serialize();
      return getWeb3(chainName).eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    },
    /**
     * Transfer ERC20 from account to toAddress
     * @param {Keypair} account
     * @param {String} toAddress
     * @param {Number} amount
     * @param {Number} gasLimit
     * @param {Number} gasPrice
     */
    transterERC20: async (chainName, account, toAddress, amount, gasLimit = 300000, gasPrice = 20000000000) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(tokenABI, tokenAddress, {
        from: account.address
      });


      const chainId = getChainId(chainName);
      const providerURL = getNodeUrl(chainName);
      const FORK_NETWORK = Common.forCustomChain(
        'mainnet',
        {
          name: chainName,
          networkId: chainId,
          chainId: chainId,
          url: providerURL,
        },
        'istanbul',
      );

      const privateKey = (account.privateKey.startsWith("0x")) ? toBuffer(`${account.privateKey}`) : toBuffer(`0x${account.privateKey}`);
      const count = await web3.eth.getTransactionCount(account.address);

      const rawTransaction = {
        from: account.address,
        nonce: web3.utils.toHex(count),
        gasPrice: web3.utils.toHex(gasPrice),
        gasLimit: web3.utils.toHex(gasLimit),
        to: tokenAddress,
        value: '0x0',
        data: contract.methods.transfer(toAddress, web3.utils.toBN(amount * Math.pow(10, decimals))).encodeABI(),
      };

      const tx = new EthereumTx(rawTransaction, { common: FORK_NETWORK });

      tx.sign(privateKey);
      const serializedTx = tx.serialize();

      return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    },
    /**
     * Get Balance of ETH of account
     * @param {String} address
     */
    getBalanceOfAccount: async (chainName, address) => {
      return getWeb3(chainName).eth.getBalance(address);
    },
    /**
     * Get Balance ot Token of account
     * @param {String} address
     */
    getBalanceOfTokenOfAccount: async (chainName, address) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(tokenABI, tokenAddress);
      const amount = await contract.methods.balanceOf(address).call();
      const realAmount = ethers.utils.formatUnits(amount, decimals);
      return realAmount;
    },
    /**
     * Get allowance of Token for a contract
     * @param {String} accountAddress
     * @param {String} allowAddress
     */
    getAllowance: async (chainName, accountAddress, allowAddress) => {
      const web3 = getWeb3(chainName);
      const contract = new web3.eth.Contract(tokenABI, tokenAddress);
      const amount = await contract.methods.allowance(accountAddress, allowAddress).call();

      return amount;
    },
    /**
     * Get gas limit to approve
     * @param {Keypair} account
     * @param {String} approveAddress
     * @param {Number} wad
     */
    getApproveGasLimit: async (chainName, account, approveAddress, wad) => {
      try {
        const web3 = getWeb3(chainName);
        const contract = new web3.eth.Contract(tokenABI, tokenAddress);
        const transactionData = await contract.methods.approve(approveAddress, wad).encodeABI();

        const tx = {
          from: account.address,
          to: tokenAddress,
          data: transactionData,
        };

        return web3.eth.estimateGas(tx);
      } catch (e) {
        console.log("Get approve gas limit error:", e);
        return 0;
      }
    },
    /**
     * Approve
     * @param {Keypair} account
     * @param {String} approveAddress
     * @param {Number} wad
     */
    approve: async (chainName, account, approveAddress, wad, gasLimit, gasPrice) => {
      try {
        const web3 = getWeb3(chainName);
        const contract = new web3.eth.Contract(tokenABI, tokenAddress);
        const chainId = getChainId(chainName);
        const providerURL = getNodeUrl(chainName);
        const FORK_NETWORK = Common.forCustomChain(
          'mainnet',
          {
            name: chainName,
            networkId: chainId,
            chainId: chainId,
            url: providerURL,
          },
          'istanbul',
        );

        const privateKey = (account.privateKey.startsWith("0x")) ? toBuffer(`${account.privateKey}`) : toBuffer(`0x${account.privateKey}`);
        const nounce = await web3.eth.getTransactionCount(account.address);

        const transactionData = contract.methods.approve(approveAddress, wad).encodeABI();

        const rawTransaction = {
          from: account.address,
          to: tokenAddress,
          value: '0x0',
          nonce: web3.utils.toHex(nounce),
          data: transactionData,
          gasLimit: web3.utils.toHex(gasLimit),
          gasPrice: web3.utils.toHex(gasPrice),
        };

        const tx = new EthereumTx(rawTransaction, { common: FORK_NETWORK });
        tx.sign(privateKey);
        const serializedTx = tx.serialize();
        return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
      } catch (e) {
        console.log("Claim all error:", e);
        return [];
      }
    },
    /**
     * swap
     */
     swapToken: async (chainName, fromAddress, toAddress, address, inputAmount, outputAmount, outputMin, gas, gasLimit) => {
      try {
        const web3 = getWeb3(chainName);
        let _hash = '';
        let callData = ''
        const block = await web3.eth.getBlock("latest")
        // outputMin = Math.floor(outputMin * 0.9)
        outputMin = 0;

        const uniswap_contract = ContractInstance(web3, uniswapABI, UNISWAP_ADDRESS)
        if (fromAddress == ETH_ADDRESS) {
          const method = uniswap_contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(outputMin, [WETH_ADDRESS, toAddress], DEFI_ADDRESS, block.timestamp + 10000);
          callData = method.encodeABI();
        } else if (toAddress == ETH_ADDRESS) {
          const method = uniswap_contract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(inputAmount, outputMin, [fromAddress, WETH_ADDRESS], DEFI_ADDRESS, block.timestamp + 10000);
          callData = method.encodeABI();
        } else {
          const method = uniswap_contract.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(inputAmount, outputMin, [fromAddress, toAddress], DEFI_ADDRESS, block.timestamp + 10000);
          callData = method.encodeABI();
        }

        let callerCallData = await web3.eth.abi.encodeParameters(['address', 'address', 'address', 'bytes', 'address'], [fromAddress, UNISWAP_ADDRESS, UNISWAP_ADDRESS, callData, toAddress]);
        const defi_contract = ContractInstance(web3, routerABI, DEFI_ADDRESS)
        const protocol_fee_default = await defi_contract.methods.getProtocolFeeDefault().call();
        console.log(protocol_fee_default);
        const params = [[[fromAddress, inputAmount, 2], [0, '0x']],
        [toAddress, Math.floor(outputAmount * 0.75).toString()],
        [1, [protocol_fee_default[0], protocol_fee_default[1]], [0, ZERO_ADDRESS], address, SIMPLE_CALLER_ADDRESS, callerCallData],
        [0, "0x"],
        [0, "0x"]];
        console.log(params);
        let gas = 0;
        // if (fromAddress === ETH_ADDRESS)
        //   gas = await defi_contract.methods.execute(
        //     ...params
        //   ).estimateGas({from: address, value: inputAmount})
        // else {
        //   gas = await defi_contract.methods.execute(
        //     ...params
        //   ).estimateGas({from: address})
        // }

        console.log(gas)
        if (fromAddress == ETH_ADDRESS) {
          await defi_contract.methods.execute(
            ...params
          ).send({ from: address, value: inputAmount, gasPrice: gas, gasLimit: gasLimit })
            .on("transactionHash", hash => {
              _hash = hash
            });
        } else
          await defi_contract.methods.execute(
            ...params
          ).send({ from: address })
            .on("transactionHash", hash => {
              _hash = hash
            });
        console.log(_hash)
        resolve({
          status: true,
          data: { hash: _hash }
        })
      } catch (e) {
        console.log('swap error:', e)
        return [];
      }
    },
    /**
     * amountOut
     */
    getAmountOut: async (_fromToken, _toToken) => {
      let fromAddress = (_fromToken?.address == ETH_ADDRESS ? WETH_ADDRESS : _fromToken?.address);
      let toAddress = (_toToken?.address == ETH_ADDRESS ? WETH_ADDRESS : _toToken?.address);
      let amount = 0;
      const result = await getAmountsOut(UNISWAP_ADDRESS, [fromAddress, toAddress], getBNValue(_fromToken?.amount, _fromToken.decimals))
      if (result.status) {
        amount = getCorrectDecValue(result.data[1], _toToken.decimals, -1, false)
      }
      return amount;
    }
  };
};

export default web3CustomModule;
