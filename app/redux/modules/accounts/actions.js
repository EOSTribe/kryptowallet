// @flow

import { createAction } from 'redux-actions';

/**
 * Action Types
 */
export const FETCH_ACCOUNTS = 'accounts/FETCH_ACCOUNTS';
export const CONNECT_ACCOUNT = 'accounts/CONNECT_ACCOUNT';
export const DELETE_ACCOUNT = 'accounts/DELETE_ACCOUNT';
export const CHOOSE_ACTIVE_ACCOUNT = 'accounts/CHOOSE_ACTIVE_ACCOUNT';

export const FETCH_ADDRESSES = 'accounts/FETCH_ADDRESSES';
export const ADD_ADDRESS = 'accounts/ADD_ADDRESS';
export const DELETE_ADDRESS = 'accounts/DELETE_ADDRESS';

export const FETCH_KEYS = 'accounts/FETCH_KEYS';
export const ADD_KEY = 'accounts/ADD_KEY';
export const DELETE_KEY = 'accounts/DELETE_KEY';

export const ADD_HISTORY = 'accounts/ADD_HISTORY';

export const SET_TOTAL = 'accounts/SET_TOTAL';

export const SET_CONFIG = 'accounts/SET_CONFIG';
export const GET_CONFIG = 'accounts/GET_CONFIG';

export const FETCH_TOKENS = 'accounts/FETCH_TOKENS';
export const ADD_TOKEN = 'accounts/ADD_TOKEN';
export const DELETE_TOKEN = 'accounts/DELETE_TOKEN';

export const FETCH_NFT_TOKENS = 'accounts/FETCH_NFT_TOKENS';
export const ADD_NFT_TOKEN = 'accounts/ADD_NFT_TOKEN';
export const SELECT_NFT_TOKEN = 'accounts/SELECT_NFT_TOKEN';
export const DELETE_NFTS_BY_ACCOUNT = 'accounts/DELETE_NFTS_BY_ACCOUNT';
export const DELETE_NFT_TOKEN = 'accounts/DELETE_NFT_TOKEN';

export const UPDATE_NFT_SHOW_STATUS = 'accounts/UPDATE_NFT_SHOW_STATUS';

export const RESET_WALLET = 'accounts/RESET_WALLET';

/**
 * Action Creators
 */
export const accountsActionCreators = {
  fetchAccounts: createAction(FETCH_ACCOUNTS),
  connectAccount: createAction(CONNECT_ACCOUNT),
  deleteAccount: createAction(DELETE_ACCOUNT),
  chooseActiveAccount: createAction(CHOOSE_ACTIVE_ACCOUNT),
  fetchAddresses: createAction(FETCH_ADDRESSES),
  addAddress: createAction(ADD_ADDRESS),
  deleteAddress: createAction(DELETE_ADDRESS),
  fetchKeys: createAction(FETCH_KEYS),
  addKey: createAction(ADD_KEY),
  deleteKey: createAction(DELETE_KEY),
  setConfig: createAction(SET_CONFIG),
  getConfig: createAction(GET_CONFIG),
  addHistory: createAction(ADD_HISTORY),
  setTotal: createAction(SET_TOTAL),
  fetchTokens: createAction(FETCH_TOKENS),
  addToken: createAction(ADD_TOKEN),
  deleteToken: createAction(DELETE_TOKEN),
  fetchNFTTokens: createAction(FETCH_NFT_TOKENS),
  addNFTToken: createAction(ADD_NFT_TOKEN),
  selectNFTToken: createAction(SELECT_NFT_TOKEN),
  deleteNFTsByAccount: createAction(DELETE_NFTS_BY_ACCOUNT),
  deleteNFTToken: createAction(DELETE_NFT_TOKEN),
  updateNFTShowStatus: createAction(UPDATE_NFT_SHOW_STATUS),
  resetWallet: createAction(RESET_WALLET),
};
