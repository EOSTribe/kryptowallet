// @flow

import {
  CONNECT_ACCOUNT,
  DELETE_ACCOUNT,
  FETCH_ACCOUNTS,
  FETCH_ADDRESSES,
  ADD_ADDRESS,
  DELETE_ADDRESS,
  FETCH_KEYS,
  ADD_KEY,
  SET_CONFIG,
  GET_CONFIG,
  ADD_HISTORY,
  SET_TOTAL,
  FETCH_TOKENS,
  ADD_TOKEN,
  DELETE_TOKEN,
  FETCH_NFT_TOKENS,
  ADD_NFT_TOKEN,
  SELECT_NFT_TOKEN,
  DELETE_NFTS_BY_ACCOUNT,
  DELETE_NFT_TOKEN,
} from './actions';
import { defaultReducers } from '../defaultReducers';

const DEFAULT = defaultReducers.accountsState;

export default function accountsState(state = DEFAULT, action = {}) {
  const { type, payload } = action;

  switch (type) {
    case CONNECT_ACCOUNT:
      return {
        accounts: state.accounts.concat([payload]),
        addresses: state.addresses,
        keys: state.keys,
        totals: state.totals,
        history: state.history,
        config: state.config,
        tokens: state.tokens,
        nftTokens: state.nftTokens,
      };
    case DELETE_ACCOUNT:
      return deleteAccount(state, payload);
    case FETCH_ACCOUNTS:
      break;
    case ADD_ADDRESS:
      return {
        accounts: state.accounts,
        addresses: state.addresses.concat([payload]),
        keys: state.keys,
        totals: state.totals,
        history: state.history,
        config: state.config,
        tokens: state.tokens,
        nftTokens: state.nftTokens,
      };
    case DELETE_ADDRESS:
      return deleteAddress(state, payload);
    case FETCH_ADDRESSES:
      break;
    case ADD_KEY:
      return {
        accounts: state.accounts,
        addresses: state.addresses,
        keys: state.keys.concat([payload]),
        totals: state.totals,
        history: state.history,
        config: state.config,
        tokens: state.tokens,
        nftTokens: state.nftTokens,
      };
    case FETCH_KEYS:
      break;
    case SET_CONFIG:
      return {
        accounts: state.accounts,
        addresses: state.addresses,
        keys: state.keys,
        totals: state.totals,
        history: state.history,
        config: payload,
        tokens: state.tokens,
        nftTokens: state.nftTokens,
      };
    case GET_CONFIG:
      break;
    case ADD_HISTORY:
      return {
        accounts: state.accounts,
        addresses: state.addresses,
        keys: state.keys,
        totals: state.totals,
        history: state.history.concat([payload]),
        config: state.config,
        tokens: state.tokens,
        nftTokens: state.nftTokens,
      };
    case SET_TOTAL:
      return updateTotal(state, payload);
    case ADD_TOKEN:
      return {
        accounts: state.accounts,
        addresses: state.addresses,
        keys: state.keys,
        totals: state.totals,
        history: state.history,
        config: state.config,
        tokens: state.tokens.concat([payload]),
        nftTokens: state.nftTokens,
      };
    case DELETE_TOKEN:
      return deleteToken(state, payload);
    case FETCH_TOKENS:
      break;
    case ADD_NFT_TOKEN:
      return {
        accounts: state.accounts,
        addresses: state.addresses,
        keys: state.keys,
        totals: state.totals,
        history: state.history,
        config: state.config,
        tokens: state.tokens,
        nftTokens: state.nftTokens.concat([payload]),
      };
    case SELECT_NFT_TOKEN:
      return selectNFTToken(state, payload);
    case DELETE_NFTS_BY_ACCOUNT:
      return deleteNFTsByAccount(state, payload);
    case DELETE_NFT_TOKEN:
      return deleteNFTToken(state, payload);
    case FETCH_NFT_TOKENS:
      break;
    default:
      return state;
  }
}

function updateTotal(state, payload) {
  let filteredTotals = state.totals.filter((_item, index) => _item.account !== payload.account);
  let totals = filteredTotals.concat([payload]);
  let accounts = state.accounts;
  let addresses = state.addresses;
  let keys = state.keys;
  let history = state.history;
  let config = state.config;
  let tokens = state.tokens;
  let nftTokens = state.nftTokens;

  return {
    accounts,
    addresses,
    keys,
    totals,
    history,
    config,
    tokens,
    nftTokens,
  };
}

function deleteAccount(state, payload) {
  let accounts = state.accounts.filter((_account, index) => index !== payload);
  let addresses = state.addresses;
  let keys = state.keys;
  let totals = state.totals;
  let history = state.history;
  let config = state.config;
  let tokens = state.tokens;
  let nftTokens = state.nftTokens;

  return {
    accounts,
    addresses,
    keys,
    totals,
    history,
    config,
    tokens,
    nftTokens,
  };
}

function deleteAddress(state, payload) {
  let addresses = state.addresses.filter(
    (_address, index) => index !== payload,
  );
  let accounts = state.accounts;
  let keys = state.keys;
  let totals = state.totals;
  let history = state.history;
  let config = state.config;
  let tokens = state.tokens;
  let nftTokens = state.nftTokens;

  return {
    accounts,
    addresses,
    keys,
    totals,
    history,
    config,
    tokens,
    nftTokens,
  };
}

function deleteToken(state, payload) {
  let tokens = state.tokens.filter((cell) => !(cell.address === payload.address && cell.chainName === payload.chainName));
  let addresses = state.addresses;
  let accounts = state.accounts;
  let keys = state.keys;
  let totals = state.totals;
  let history = state.history;
  let config = state.config;
  let nftTokens = state.nftTokens;

  return {
    accounts,
    addresses,
    keys,
    totals,
    history,
    config,
    tokens,
    nftTokens,
  };
}

function selectNFTToken(state, payload) {
  let accounts = state.accounts;
  let addresses = state.addresses;
  let keys = state.keys;
  let totals = state.totals;
  let history = state.history;
  let config = state.config;
  let tokens = state.tokens;

  let nftTokens = state.nftTokens.map((cell, index) => {
    if(index === payload) {
      cell.isSelected = true;
    }
    else {
      cell.isSelected = false;
    }

    return cell;
  })

  let selectedNft = nftTokens.filter((cell) => cell.isSelected);

  if(nftTokens.length > 0 && selectedNft.length === 0) {
    nftTokens[0].isSelected = true;
  }

  return {
    accounts,
    addresses,
    keys,
    totals,
    history,
    config,
    tokens,
    nftTokens,
  };
}

function deleteNFTsByAccount(state, payload) {
  let accounts = state.accounts;
  let addresses = state.addresses;
  let keys = state.keys;
  let totals = state.totals;
  let history = state.history;
  let config = state.config;
  let tokens = state.tokens;
  let nftShowStatus = state.nftShowStatus;
  let nftTokens = state.nftTokens.filter((cell) => !(cell.address === payload.address && cell.chainName === payload.chainName));
  let selectedNft = nftTokens.filter((cell) => cell.isSelected);

  if(nftTokens.length > 0 && selectedNft.length === 0) {
    nftTokens[0].isSelected = true;
  }

  return {
    accounts,
    addresses,
    keys,
    totals,
    history,
    config,
    tokens,
    nftTokens,
    nftShowStatus,
  };
}

function deleteNFTToken(state, payload) {
  let accounts = state.accounts;
  let addresses = state.addresses;
  let keys = state.keys;
  let totals = state.totals;
  let history = state.history;
  let config = state.config;
  let tokens = state.tokens;
  let nftTokens = state.nftTokens.filter((cell) => !(cell.address === payload.address && cell.chainName === payload.chainName && cell.tokenId === payload.tokenId));
  let selectedNft = nftTokens.filter((cell) => cell.isSelected);

  if(nftTokens.length > 0 && selectedNft.length === 0) {
    nftTokens[0].isSelected = true;
  }

  return {
    accounts,
    addresses,
    keys,
    totals,
    history,
    config,
    tokens,
    nftTokens,
  };
}
