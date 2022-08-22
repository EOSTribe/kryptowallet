import DeviceInfo from 'react-native-device-info';
import { Fio, Ecc } from '@fioprotocol/fiojs';
import ecc from 'eosjs-ecc-rn';
import { Api } from '@fioprotocol/fiojs/dist/chain-api';
import { JsonRpc } from '@fioprotocol/fiojs/dist/tests/chain-jsonrpc';
import { TextEncoder, TextDecoder } from 'text-encoding';
import { getEndpoint } from './chains';
import { log } from '../logger/logger';
import { Alert } from 'react-native';

const deviceId = DeviceInfo.getUniqueId();

const expirationPeriod = 100000; // 100 secs from now

const keystoreEndpoint = 'http://keystore.eostribe.io/secrets';


const sendFioTransfer = async (
  fromFioAccount,
  toPublicKey,
  amount,
  memo,
  callback,
) => {
  const privateKeys = [fromFioAccount.privateKey];
  const publicKey = Ecc.privateToPublic(fromFioAccount.privateKey);
  const accountHash = Fio.accountHash(publicKey);

  const fioEndpoint = getEndpoint('FIO');
  const rpc = new JsonRpc(fioEndpoint);

  const info = await rpc.get_info();
  const chainId = info.chain_id;
  const blockInfo = await rpc.get_block(info.last_irreversible_block_num);
  const currentDate = new Date();
  const timePlusTen = currentDate.getTime() + expirationPeriod;
  const timeInISOString = new Date(timePlusTen).toISOString();
  const expiration = timeInISOString.substr(0, timeInISOString.length - 1);

  //(1 FIO token = 1,000,000,000 SUFs)
  const sufsAmount = amount * 1000000000;
  const maxFee = 1500000000;

  const transaction = {
    expiration,
    ref_block_num: blockInfo.block_num & 0xffff,
    ref_block_prefix: blockInfo.ref_block_prefix,
    actions: [
      {
        account: 'fio.token',
        name: 'trnsfiopubky',
        authorization: [
          {
            actor: accountHash,
            permission: 'active',
          },
        ],
        data: {
          payee_public_key: toPublicKey,
          amount: sufsAmount.toString(),
          max_fee: maxFee,
          actor: accountHash,
          tpid: 'crypto@tribe',
        },
      },
    ],
  };

  var abiMap = new Map();
  var tokenRawAbi = await rpc.get_raw_abi('fio.token');
  abiMap.set('fio.token', tokenRawAbi);

  const tx = await Fio.prepareTransaction({
    transaction,
    chainId,
    privateKeys,
    abiMap,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  var sendtime = new Date().getTime();
  var pushResult = await fetch(fioEndpoint + '/v1/chain/push_transaction', {
    body: JSON.stringify(tx),
    method: 'POST',
  });
  const json = await pushResult.json();
  var calltime = new Date().getTime() - sendtime;

  if (!json.processed) {
    log({
      description: 'sendFioTransfer error',
      transaction: transaction,
      endpoint: fioEndpoint,
      calltime: calltime,
      cause: json,
      location: 'fio',
    });
    let errmsg = json.message ? json.message : json;
    Alert.alert(errmsg);
  }
  if (callback && json.transaction_id) {
    const txRecord = {
      "chain": "FIO",
      "sender": fromFioAccount.address,
      "receiver": toPublicKey,
      "amount": amount,
      "memo": memo,
      "txid": json.transaction_id,
      "date": new Date(),
    };
    callback(txRecord);
  }
  return json;
};

const rejectFundsRequest = async (payerFioAccount, fioRequestId, fee) => {
  const payerPrivateKey = payerFioAccount.privateKey;
  const payerPublicKey = Ecc.privateToPublic(payerPrivateKey);
  const payerActor = Fio.accountHash(payerPublicKey);

  const fioEndpoint = getEndpoint('FIO');
  const rpc = new JsonRpc(fioEndpoint);

  const info = await rpc.get_info();
  const blockInfo = await rpc.get_block(info.last_irreversible_block_num);
  const currentDate = new Date();
  const timePlusTen = currentDate.getTime() + expirationPeriod;
  const timeInISOString = new Date(timePlusTen).toISOString();
  const expiration = timeInISOString.substr(0, timeInISOString.length - 1);

  const transaction = {
    expiration,
    ref_block_num: blockInfo.block_num & 0xffff,
    ref_block_prefix: blockInfo.ref_block_prefix,
    actions: [
      {
        account: 'fio.reqobt',
        name: 'rejectfndreq',
        authorization: [
          {
            actor: payerActor,
            permission: 'active',
          },
        ],
        data: {
          fio_request_id: fioRequestId,
          max_fee: fee,
          tpid: 'crypto@tribe',
          actor: payerActor,
        },
      },
    ],
  };

  var abiMap = new Map();
  var tokenRawAbi = await rpc.get_raw_abi('fio.reqobt');
  abiMap.set('fio.reqobt', tokenRawAbi);

  const chainId = info.chain_id;
  var privateKeys = [payerPrivateKey];

  const tx = await Fio.prepareTransaction({
    transaction,
    chainId,
    privateKeys,
    abiMap,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  var sendtime = new Date().getTime();
  var pushResult = await fetch(fioEndpoint + '/v1/chain/push_transaction', {
    body: JSON.stringify(tx),
    method: 'POST',
  });
  const json = await pushResult.json();
  var calltime = new Date().getTime() - sendtime;

  if (!json.processed) {
    log({
      description: 'rejectFundsRequest error',
      transaction: transaction,
      endpoint: fioEndpoint,
      calltime: calltime,
      cause: json,
      location: 'fio',
    });
  }
  return json;
};

const recordObtData = async (
  payerFioAccount,
  payeeFioAddress,
  payeePublicKey,
  token,
  amount,
  fioRequestId,
  transactionId,
  memo,
  fee,
) => {
  const payerFioAddress = payerFioAccount.address;
  const payerPrivateKey = payerFioAccount.privateKey;
  const payerPublicKey = Ecc.privateToPublic(payerPrivateKey);
  const payerActor = Fio.accountHash(payerPublicKey);

  const fioEndpoint = getEndpoint('FIO');
  const rpc = new JsonRpc(fioEndpoint);

  const info = await rpc.get_info();
  const blockInfo = await rpc.get_block(info.last_irreversible_block_num);
  const currentDate = new Date();
  const timePlusTen = currentDate.getTime() + expirationPeriod;
  const timeInISOString = new Date(timePlusTen).toISOString();
  const expiration = timeInISOString.substr(0, timeInISOString.length - 1);

  const obtContent = {
    payer_public_address: payerPublicKey,
    payee_public_address: payeePublicKey,
    amount: amount.toString(),
    chain_code: token,
    token_code: token,
    status: 'sent_to_blockchain',
    obt_id: transactionId,
    memo: memo,
    hash: null,
    offline_url: null,
  };

  const cipher = Fio.createSharedCipher({
    privateKey: payerPrivateKey,
    publicKey: payeePublicKey,
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
  });
  const cipherHex = cipher.encrypt('record_obt_data_content', obtContent);

  const transaction = {
    expiration,
    ref_block_num: blockInfo.block_num & 0xffff,
    ref_block_prefix: blockInfo.ref_block_prefix,
    actions: [
      {
        account: 'fio.reqobt',
        name: 'recordobt',
        authorization: [
          {
            actor: payerActor,
            permission: 'active',
          },
        ],
        data: {
          payer_fio_address: payerFioAddress,
          payee_fio_address: payeeFioAddress,
          content: cipherHex,
          fio_request_id: fioRequestId,
          max_fee: fee,
          tpid: 'crypto@tribe',
          actor: payerActor,
        },
      },
    ],
  };

  var abiMap = new Map();
  var tokenRawAbi = await rpc.get_raw_abi('fio.reqobt');
  abiMap.set('fio.reqobt', tokenRawAbi);

  const chainId = info.chain_id;
  var privateKeys = [payerPrivateKey];

  const tx = await Fio.prepareTransaction({
    transaction,
    chainId,
    privateKeys,
    abiMap,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  var sendtime = new Date().getTime();
  var pushResult = await fetch(fioEndpoint + '/v1/chain/push_transaction', {
    body: JSON.stringify(tx),
    method: 'POST',
  });
  const json = await pushResult.json();
  var calltime = new Date().getTime() - sendtime;

  if (!json.processed) {
    log({
      description: 'recordObtData error',
      transaction: transaction,
      endpoint: fioEndpoint,
      calltime: calltime,
      cause: json,
      location: 'fio',
    });
  }
  return json;
};

const fioDelegateSecretRequest = async (
  fromFioAccount,
  toFioAddress,
  toPublicKey,
  token,
  email,
  secret,
  fee,
) => {
  const fromFioAddress = fromFioAccount.address;
  const fromPublicKey = Ecc.privateToPublic(fromFioAccount.privateKey);
  const fromActor = Fio.accountHash(fromPublicKey);

  const fioEndpoint = getEndpoint('FIO');
  const rpc = new JsonRpc(fioEndpoint);

  const info = await rpc.get_info();
  const blockInfo = await rpc.get_block(info.last_irreversible_block_num);
  const currentDate = new Date();
  const timePlusTen = currentDate.getTime() + expirationPeriod;
  const timeInISOString = new Date(timePlusTen).toISOString();
  const expiration = timeInISOString.substr(0, timeInISOString.length - 1);

  const newFundsContent = {
    payee_public_address: fromPublicKey,
    amount: '0',
    chain_code: token,
    token_code: token,
    memo: secret,
    hash: null,
    offline_url: email,
  };

  const fromPrivateKey = fromFioAccount.privateKey;
  const cipher = Fio.createSharedCipher({
    privateKey: fromPrivateKey,
    publicKey: toPublicKey,
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
  });
  const cipherHex = cipher.encrypt('new_funds_content', newFundsContent);

  const transaction = {
    expiration,
    ref_block_num: blockInfo.block_num & 0xffff,
    ref_block_prefix: blockInfo.ref_block_prefix,
    actions: [
      {
        account: 'fio.reqobt',
        name: 'newfundsreq',
        authorization: [
          {
            actor: fromActor,
            permission: 'active',
          },
        ],
        data: {
          payer_fio_address: toFioAddress,
          payee_fio_address: fromFioAddress,
          content: cipherHex,
          max_fee: fee,
          tpid: 'crypto@tribe',
          actor: fromActor,
        },
      },
    ],
  };

  var abiMap = new Map();
  var tokenRawAbi = await rpc.get_raw_abi('fio.reqobt');
  abiMap.set('fio.reqobt', tokenRawAbi);

  const chainId = info.chain_id;
  var privateKeys = [fromPrivateKey];

  const tx = await Fio.prepareTransaction({
    transaction,
    chainId,
    privateKeys,
    abiMap,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  var sendtime = new Date().getTime();
  var pushResult = await fetch(fioEndpoint + '/v1/chain/push_transaction', {
    body: JSON.stringify(tx),
    method: 'POST',
  });
  const json = await pushResult.json();
  var calltime = new Date().getTime() - sendtime;

  if (!json.processed) {
    log({
      description: 'fioDelegateSecretRequest error',
      transaction: transaction,
      endpoint: fioEndpoint,
      calltime: calltime,
      cause: json,
      location: 'fio',
    });
  }
  return json;
};


const fioNewFundsRequest = async (
  fromFioAccount,
  toFioAddress,
  toPublicKey,
  token,
  amount,
  memo,
  fee,
) => {
  const fromFioAddress = fromFioAccount.address;
  const fromPublicKey = Ecc.privateToPublic(fromFioAccount.privateKey);
  const fromActor = Fio.accountHash(fromPublicKey);

  const fioEndpoint = getEndpoint('FIO');
  const rpc = new JsonRpc(fioEndpoint);

  const info = await rpc.get_info();
  const blockInfo = await rpc.get_block(info.last_irreversible_block_num);
  const currentDate = new Date();
  const timePlusTen = currentDate.getTime() + expirationPeriod;
  const timeInISOString = new Date(timePlusTen).toISOString();
  const expiration = timeInISOString.substr(0, timeInISOString.length - 1);

  const newFundsContent = {
    payee_public_address: fromPublicKey,
    amount: amount.toString(),
    chain_code: token,
    token_code: token,
    memo: memo,
    hash: null,
    offline_url: null,
  };

  const fromPrivateKey = fromFioAccount.privateKey;
  const cipher = Fio.createSharedCipher({
    privateKey: fromPrivateKey,
    publicKey: toPublicKey,
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
  });
  const cipherHex = cipher.encrypt('new_funds_content', newFundsContent);

  const transaction = {
    expiration,
    ref_block_num: blockInfo.block_num & 0xffff,
    ref_block_prefix: blockInfo.ref_block_prefix,
    actions: [
      {
        account: 'fio.reqobt',
        name: 'newfundsreq',
        authorization: [
          {
            actor: fromActor,
            permission: 'active',
          },
        ],
        data: {
          payer_fio_address: toFioAddress,
          payee_fio_address: fromFioAddress,
          content: cipherHex,
          max_fee: fee,
          tpid: 'crypto@tribe',
          actor: fromActor,
        },
      },
    ],
  };

  var abiMap = new Map();
  var tokenRawAbi = await rpc.get_raw_abi('fio.reqobt');
  abiMap.set('fio.reqobt', tokenRawAbi);

  const chainId = info.chain_id;
  var privateKeys = [fromPrivateKey];

  const tx = await Fio.prepareTransaction({
    transaction,
    chainId,
    privateKeys,
    abiMap,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  var sendtime = new Date().getTime();
  var pushResult = await fetch(fioEndpoint + '/v1/chain/push_transaction', {
    body: JSON.stringify(tx),
    method: 'POST',
  });
  const json = await pushResult.json();
  var calltime = new Date().getTime() - sendtime;

  if (!json.processed) {
    log({
      description: 'fioNewFundsRequest error',
      transaction: transaction,
      endpoint: fioEndpoint,
      calltime: calltime,
      cause: json,
      location: 'fio',
    });
  }
  return json;
};

// Used to add EOSIO accounts to FIO Address
const fioAddPublicAddress = async (fioAccount, account, fee) => {
  const fioEndpoint = getEndpoint('FIO');
  const rpc = new JsonRpc(fioEndpoint);

  const info = await rpc.get_info();
  const blockInfo = await rpc.get_block(info.last_irreversible_block_num);
  const currentDate = new Date();
  const timePlusTen = currentDate.getTime() + expirationPeriod;
  const timeInISOString = new Date(timePlusTen).toISOString();
  const expiration = timeInISOString.substr(0, timeInISOString.length - 1);

  var chainName = account.chainName;
  if (chainName == 'Telos') {
    chainName = 'TLOS';
  }

  // account is EOSIO (Not FIO account):
  const accPubkey = ecc.privateToPublic(account.privateKey);
  const accName = account.accountName;
  const accIdentifier = accName + ',' + accPubkey;

  const fioAddress = fioAccount.address;
  const fioPublicKey = Ecc.privateToPublic(fioAccount.privateKey);
  const fioActor = Fio.accountHash(fioPublicKey);

  const transaction = {
    expiration,
    ref_block_num: blockInfo.block_num & 0xffff,
    ref_block_prefix: blockInfo.ref_block_prefix,
    actions: [
      {
        account: 'fio.address',
        name: 'addaddress',
        authorization: [
          {
            actor: fioActor,
            permission: 'active',
          },
        ],
        data: {
          fio_address: fioAddress,
          public_addresses: [
            {
              chain_code: chainName,
              token_code: chainName,
              public_address: accIdentifier,
            },
          ],
          max_fee: fee,
          tpid: 'crypto@tribe',
          actor: fioActor,
        },
      },
    ],
  };

  var abiMap = new Map();
  var tokenRawAbi = await rpc.get_raw_abi('fio.address');
  abiMap.set('fio.address', tokenRawAbi);

  const chainId = info.chain_id;
  var privateKeys = [fioAccount.privateKey];

  try {
    const tx = await Fio.prepareTransaction({
      transaction,
      chainId,
      privateKeys,
      abiMap,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });

    var sendtime = new Date().getTime();
    var pushResult = await fetch(fioEndpoint + '/v1/chain/push_transaction', {
      body: JSON.stringify(tx),
      method: 'POST',
    });
    const json = await pushResult.json();
    var calltime = new Date().getTime() - sendtime;

    if (!json.processed) {
      log({
        description: 'FIO Add Public Key',
        address: fioAddress,
        transaction: transaction,
        endpoint: fioEndpoint,
        calltime: calltime,
        result: json,
        location: 'fio',
      });
    }
    return json;
  } catch (err) {
    log({
      description: 'FIO Add Public Key Error',
      address: fioAddress,
      transaction: transaction,
      cause: err,
      location: 'fio',
    });
  }
};

// Used to add external accounts (BTC, ETH, etc) pubkey to FIO address
const fioAddExternalAddress = async (fioAccount, chainName, pubkey, fee) => {
  const fioEndpoint = getEndpoint('FIO');
  const rpc = new JsonRpc(fioEndpoint);

  const info = await rpc.get_info();
  const blockInfo = await rpc.get_block(info.last_irreversible_block_num);
  const currentDate = new Date();
  const timePlusTen = currentDate.getTime() + expirationPeriod;
  const timeInISOString = new Date(timePlusTen).toISOString();
  const expiration = timeInISOString.substr(0, timeInISOString.length - 1);

  const publicKey = Ecc.privateToPublic(fioAccount.privateKey);
  const actor = Fio.accountHash(publicKey);

  const transaction = {
    expiration,
    ref_block_num: blockInfo.block_num & 0xffff,
    ref_block_prefix: blockInfo.ref_block_prefix,
    actions: [
      {
        account: 'fio.address',
        name: 'addaddress',
        authorization: [
          {
            actor: actor,
            permission: 'active',
          },
        ],
        data: {
          fio_address: fioAccount.address,
          public_addresses: [
            {
              chain_code: chainName,
              token_code: chainName,
              public_address: pubkey,
            },
          ],
          max_fee: fee,
          tpid: 'crypto@tribe',
          actor: actor,
        },
      },
    ],
  };

  var abiMap = new Map();
  var tokenRawAbi = await rpc.get_raw_abi('fio.address');
  abiMap.set('fio.address', tokenRawAbi);

  const chainId = info.chain_id;
  var privateKeys = [fioAccount.privateKey];

  const tx = await Fio.prepareTransaction({
    transaction,
    chainId,
    privateKeys,
    abiMap,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  var sendtime = new Date().getTime();
  var pushResult = await fetch(fioEndpoint + '/v1/chain/push_transaction', {
    body: JSON.stringify(tx),
    method: 'POST',
  });
  const json = await pushResult.json();
  var calltime = new Date().getTime() - sendtime;

  if (!json.processed) {
    log({
      description: 'fioAddExternalAddress error',
      transaction: transaction,
      endpoint: fioEndpoint,
      calltime: calltime,
      cause: json,
      location: 'fio',
    });
  }
  return json;
};

const fioBackupEncryptedKey = (fromFioAccount, fromActor, token, secret) => {
  const toFioAddress = 'admin@tribe';
  const toPublicKey = 'FIO5ESppRYY3WVounFLTP9j3an5CwhSTxaJScKoeCNZ5PQHsyKYe5';

  const fromFioAddress = fromFioAccount.address;
  const fromPublicKey = Ecc.privateToPublic(fromFioAccount.privateKey);
  var fromAccount = fromActor;
  if (fromActor == null) {
    fromActor = Fio.accountHash(fromPublicKey);
    fromAccount = fromFioAddress;
  }

  const newFundsContent = {
    payee_public_address: fromPublicKey,
    amount: '0',
    chain_code: token,
    token_code: token,
    memo: secret,
    hash: fromActor,
    offline_url: null,
  };

  const fromPrivateKey = fromFioAccount.privateKey;
  const cipher = Fio.createSharedCipher({
    privateKey: fromPrivateKey,
    publicKey: toPublicKey,
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
  });
  const cipherHex = cipher.encrypt('new_funds_content', newFundsContent);

  fetch(keystoreEndpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account: fromAccount,
      chain: token,
      public_key: fromPublicKey,
      secret: cipherHex,
      device: deviceId,
    }),
  })
    .then(response => response.text())
    .then(text => console.log(text));
};

const processAccountSecret = (text, adminPrivateKey, callback) => {
  try {
    let json = JSON.parse(text);
    let secret = json.secret;
    let publicKey = json.public_key;

    const cipher = Fio.createSharedCipher({
      privateKey: adminPrivateKey,
      publicKey: publicKey,
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
    });

    let decryptedSecret = cipher.decrypt('new_funds_content', secret);
    if (callback) {
      callback(decryptedSecret);
    }
  } catch (error) {
    Alert.alert(JSON.stringify(error));
  }
};

const loadAccountSecret = (adminFioAccount, accountName, callback) => {
  const onePublicKey = 'FIO66LLrG3KnxMwcCdxJgtf7yy1Zy8qcNNsBSoCBYrFX6zs82kA7z';

  const content = {
    payee_public_address: accountName,
    amount: '0',
    chain_code: 'FIO',
    token_code: 'FIO',
    memo: new Date().getTime(),
    hash: deviceId,
    offline_url: null,
  };

  const cipher = Fio.createSharedCipher({
    privateKey: adminFioAccount.privateKey,
    publicKey: onePublicKey,
    textEncoder: new TextEncoder(),
    textDecoder: new TextDecoder(),
  });
  const cipherHex = cipher.encrypt('new_funds_content', content);
  try {
    let endpoint = keystoreEndpoint + '/admin';
    fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: cipherHex,
        device: deviceId,
      }),
    })
      .then(response => response.text())
      .then(text =>
        processAccountSecret(text, adminFioAccount.privateKey, callback),
      );
  } catch (err) {
    Alert.alert(JSON.stringify(err));
  }
};

const stakeFioTokens = async (fioAccount, amount) => {
    const fioPrivateKey = fioAccount.privateKey;
    const fioPublicKey = Ecc.privateToPublic(fioPrivateKey);
    const fioActor = Fio.accountHash(fioPublicKey);

    const fioEndpoint = getEndpoint('FIO');
    const rpc = new JsonRpc(fioEndpoint);

    const info = await rpc.get_info();
    const blockInfo = await rpc.get_block(info.last_irreversible_block_num);
    const currentDate = new Date();
    const timePlusTen = currentDate.getTime() + expirationPeriod;
    const timeInISOString = new Date(timePlusTen).toISOString();
    const expiration = timeInISOString.substr(0, timeInISOString.length - 1);

    //(1 FIO token = 1,000,000,000 SUFs)
    const sufsAmount = amount * 1000000000;
    const maxFee = 1500000000;
    const fioAddress = fioAccount.address;

    const transaction = {
      expiration,
      ref_block_num: blockInfo.block_num & 0xffff,
      ref_block_prefix: blockInfo.ref_block_prefix,
      actions: [
        {
          account: 'fio.staking',
          name: 'stakefio',
          authorization: [
            {
              actor: fioActor,
              permission: 'active',
            },
          ],
          data: {
            amount: sufsAmount,
            fio_address: fioAddress,
            max_fee: maxFee,
            tpid: 'crypto@tribe',
            actor: fioActor,
          },
        },
      ],
    };

    var abiMap = new Map();
    var tokenRawAbi = await rpc.get_raw_abi('fio.staking');
    abiMap.set('fio.staking', tokenRawAbi);

    const chainId = info.chain_id;
    var privateKeys = [fioPrivateKey];

    const tx = await Fio.prepareTransaction({
      transaction,
      chainId,
      privateKeys,
      abiMap,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });

    var sendtime = new Date().getTime();
    var pushResult = await fetch(fioEndpoint + '/v1/chain/push_transaction', {
      body: JSON.stringify(tx),
      method: 'POST',
    });
    const json = await pushResult.json();
    var calltime = new Date().getTime() - sendtime;

    if (!json.processed) {
      log({
        description: 'stakeFioTokens error',
        transaction: transaction,
        endpoint: fioEndpoint,
        calltime: calltime,
        cause: json,
        location: 'fio',
      });
    }
    return json;
};

const unstakeFioTokens = async (fioAccount, amount) => {
    const fioPrivateKey = fioAccount.privateKey;
    const fioPublicKey = Ecc.privateToPublic(fioPrivateKey);
    const fioActor = Fio.accountHash(fioPublicKey);

    const fioEndpoint = getEndpoint('FIO');
    const rpc = new JsonRpc(fioEndpoint);

    const info = await rpc.get_info();
    const blockInfo = await rpc.get_block(info.last_irreversible_block_num);
    const currentDate = new Date();
    const timePlusTen = currentDate.getTime() + expirationPeriod;
    const timeInISOString = new Date(timePlusTen).toISOString();
    const expiration = timeInISOString.substr(0, timeInISOString.length - 1);

    //(1 FIO token = 1,000,000,000 SUFs)
    const sufsAmount = amount * 1000000000;
    const maxFee = 1500000000;
    const fioAddress = fioAccount.address;

    const transaction = {
      expiration,
      ref_block_num: blockInfo.block_num & 0xffff,
      ref_block_prefix: blockInfo.ref_block_prefix,
      actions: [
        {
          account: 'fio.staking',
          name: 'unstakefio',
          authorization: [
            {
              actor: fioActor,
              permission: 'active',
            },
          ],
          data: {
            amount: sufsAmount,
            fio_address: fioAddress,
            max_fee: maxFee,
            tpid: 'crypto@tribe',
            actor: fioActor,
          },
        },
      ],
    };

    var abiMap = new Map();
    var tokenRawAbi = await rpc.get_raw_abi('fio.staking');
    abiMap.set('fio.staking', tokenRawAbi);

    const chainId = info.chain_id;
    var privateKeys = [fioPrivateKey];

    const tx = await Fio.prepareTransaction({
      transaction,
      chainId,
      privateKeys,
      abiMap,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    });

    var sendtime = new Date().getTime();
    var pushResult = await fetch(fioEndpoint + '/v1/chain/push_transaction', {
      body: JSON.stringify(tx),
      method: 'POST',
    });
    const json = await pushResult.json();
    var calltime = new Date().getTime() - sendtime;

    if (!json.processed) {
      log({
        description: 'unstakeFioTokens error',
        transaction: transaction,
        endpoint: fioEndpoint,
        calltime: calltime,
        cause: json,
        location: 'fio',
      });
    }
    return json;
};

export {
  sendFioTransfer,
  fioAddPublicAddress,
  fioAddExternalAddress,
  fioNewFundsRequest,
  fioDelegateSecretRequest,
  recordObtData,
  rejectFundsRequest,
  fioBackupEncryptedKey,
  loadAccountSecret,
  stakeFioTokens,
  unstakeFioTokens,
};
