import { JsonRpc, Api } from 'eosjs-rn';
import { JsSignatureProvider } from 'eosjs-rn/dist/eosjs-jssig';
import { TextEncoder, TextDecoder } from 'text-encoding';
import { getEndpoint } from './chains';
import { getAccount } from './eos';

const BN = require('bn.js');


const getApi = (privateKey) => {
  const endpoint = getEndpoint('Telos');
  const rpc = new JsonRpc(endpoint);
  const signatureProvider = new JsSignatureProvider([privateKey]);

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });
  return api;
}

const getTable = async (api, data) => {
    const defaultParams = {
      json: true, // Get the response as json
      code: '', // Contract that we target
      scope: '', // Account that owns the data
      table: '', // Table name
      key_type: `i64`, // Type of key
      index_position: 1, // Position of index
      lower_bound: '', // Table secondary key value
      limit: 10, // Here we limit to 10 to get ten row
      reverse: false, // Optional: Get reversed data
      show_payer: false // Optional: Show ram payer
    };
    const params = Object.assign({}, defaultParams, data);
    return await api.rpc.get_table_rows(params);
}



const getEvmAccount = async (api, address) => {
    if (address.startsWith('0x')) address = address.substring(2);
    address = address.toLowerCase();
    const padded = '0'.repeat(12 * 2) + address;

    const data = {
      code: 'eosio.evm',
      scope: 'eosio.evm',
      table: 'account',
      key_type: 'sha256',
      index_position: 2,
      lower_bound: padded,
      upper_bound: padded,
      limit: 1
    };

    const { rows } = await getTable(api, data);

    if (rows.length && rows[0].address === address) {
      let account = rows[0];
      account.address = `0x${account.address}`;
      account.balance = new BN(account.balance, 16)._strip();
      return account;
    } else {
      return undefined;
    }
};


const transferTelosToEVM = async (fromTelosAccount, toEVMAddress, amount) => {
  const endpoint = getEndpoint("Telos");
  const rpc = new JsonRpc(endpoint);
  const signatureProvider = new JsSignatureProvider([fromTelosAccount.privateKey]);

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  const evmAccount = await getEvmAccount(api, toEVMAddress);
  const fromAccountName = fromTelosAccount.accountName;
  // If EVM account exists - just send transfer:
  if (evmAccount) {
    return api.transact(
    {
      actions: [
        {
          account: 'eosio.token',
          name: 'transfer',
          authorization: [
            {
              actor: fromAccountName,
              permission: 'active',
            },
          ],
          data: {
            from: fromAccountName,
            to: 'eosio.evm',
            quantity: `${amount.toFixed(4)} TLOS`,
            memo: toEVMAddress,
          },
        },
      ],
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
    },
    );
  } else { // Otherwise openwallet and send transfer:
    return api.transact(
    {
      actions: [
        {
          account: 'eosio.evm',
          name: 'openwallet',
          authorization: [
            {
              actor: fromAccountName,
              permission: 'active',
            },
          ],
          data: {
            account: fromAccountName,
            address: toEVMAddress.slice(2),
          },
        },
        {
          account: 'eosio.token',
          name: 'transfer',
          authorization: [
            {
              actor: fromAccountName,
              permission: 'active',
            },
          ],
          data: {
            from: fromAccountName,
            to: 'eosio.evm',
            quantity: `${amount.toFixed(4)} TLOS`,
            memo: toEVMAddress,
          },
        },
      ]
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
    });
  }
};
  

export {
	transferTelosToEVM,
}