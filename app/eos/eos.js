import { JsonRpc, Api } from 'eosjs-rn';
import { JsSignatureProvider } from 'eosjs-rn/dist/eosjs-jssig';
import { TextEncoder, TextDecoder } from 'text-encoding';
import { getChain, getEndpoint } from './chains';

const getAccount = (accountName, chain) => {
  const endpoint = getEndpoint(chain.name);
  const rpc = new JsonRpc(endpoint);
  return rpc.get_account(accountName);
};

const getActions = (accountName, chain) => {
  const endpoint = getEndpoint(chain.name);
  const rpc = new JsonRpc(endpoint);
  return rpc.history_get_actions(accountName);
};

const getProducers = chain => {
  const endpoint = getEndpoint(chain.name);
  const rpc = new JsonRpc(endpoint);
  return rpc.get_producers(true, '', 100);
};

const stake = (account, cpuAmount, netAmount, chain) => {
  const endpoint = getEndpoint(chain.name);
  const rpc = new JsonRpc(endpoint);
  const signatureProvider = new JsSignatureProvider([account.privateKey]);

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  return api.transact(
    {
      actions: [
        {
          account: 'eosio',
          name: 'delegatebw',
          authorization: [
            {
              actor: account.accountName,
              permission: 'active',
            },
          ],
          data: {
            from: account.accountName,
            receiver: account.accountName,
            stake_cpu_quantity: `${cpuAmount.toFixed(4)} ${chain.symbol}`,
            stake_net_quantity: `${netAmount.toFixed(4)} ${chain.symbol}`,
            transfer: false,
          },
        },
      ],
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
    },
  );
};

const unstake = (account, cpuAmount, netAmount, chain) => {
  const endpoint = getEndpoint(chain.name);
  const rpc = new JsonRpc(endpoint);
  const signatureProvider = new JsSignatureProvider([account.privateKey]);

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  return api.transact(
    {
      actions: [
        {
          account: 'eosio',
          name: 'undelegatebw',
          authorization: [
            {
              actor: account.accountName,
              permission: 'active',
            },
          ],
          data: {
            from: account.accountName,
            receiver: account.accountName,
            unstake_cpu_quantity: `${cpuAmount.toFixed(4)} ${chain.symbol}`,
            unstake_net_quantity: `${netAmount.toFixed(4)} ${chain.symbol}`
          },
        },
      ],
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
    },
  );
};

const buyram = (account, amount, chain) => {
  const endpoint = getEndpoint(chain.name);
  const rpc = new JsonRpc(endpoint);
  const signatureProvider = new JsSignatureProvider([account.privateKey]);

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  return api.transact(
    {
      actions: [
        {
          account: 'eosio',
          name: 'buyram',
          authorization: [
            {
              actor: account.accountName,
              permission: 'active',
            },
          ],
          data: {
            payer: account.accountName,
            quant: `${amount.toFixed(4)} ${chain.symbol}`,
            receiver: account.accountName,
          },
        },
      ],
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
    },
  );
};

const sellram = (account, bytes, chain) => {
  const endpoint = getEndpoint(chain.name);
  const rpc = new JsonRpc(endpoint);
  const signatureProvider = new JsSignatureProvider([account.privateKey]);

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  return api.transact(
    {
      actions: [
        {
          account: 'eosio',
          name: 'sellram',
          authorization: [
            {
              actor: account.accountName,
              permission: 'active',
            },
          ],
          data: {
            account: account.accountName,
            bytes: bytes,
          },
        },
      ],
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
    },
  );
};

const transfer = (toAccountName, amount, memo, fromAccount, chain) => {
  const endpoint = getEndpoint(chain.name);
  const rpc = new JsonRpc(endpoint);
  const signatureProvider = new JsSignatureProvider([fromAccount.privateKey]);

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  return api.transact(
    {
      actions: [
        {
          account: 'eosio.token',
          name: 'transfer',
          authorization: [
            {
              actor: fromAccount.accountName,
              permission: 'active',
            },
          ],
          data: {
            from: fromAccount.accountName,
            to: toAccountName,
            quantity: `${amount.toFixed(4)} ${chain.symbol}`,
            memo,
          },
        },
      ],
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
    },
  );
};


const voteProducers = (producers, fromAccount, chain) => {
  const endpoint = getEndpoint(chain.name);
  const rpc = new JsonRpc(endpoint);
  const signatureProvider = new JsSignatureProvider([fromAccount.privateKey]);

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  return api.transact(
    {
      actions: [
        {
          account: 'eosio',
          name: 'voteproducer',
          authorization: [
            {
              actor: fromAccount.accountName,
              permission: 'active',
            },
          ],
          data: {
            voter: fromAccount.accountName,
            proxy: '',
            producers,
          },
        },
      ],
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
    },
  );
};

const sumAmount = (amount1, amount2) => {
  const m1 = parseFloat(amount1.split(' ')[0]);
  const m2 = parseFloat(amount2.split(' ')[0]);
  const totalM = m1 + m2;
  return totalM.toFixed(4);
};

export {
  getAccount,
  getProducers,
  getActions,
  stake,
  unstake,
  buyram,
  sellram,
  transfer,
  voteProducers,
  sumAmount,
};
