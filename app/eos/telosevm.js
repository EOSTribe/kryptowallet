import { JsonRpc, Api } from 'eosjs-rn';
import { JsSignatureProvider } from 'eosjs-rn/dist/eosjs-jssig';
import { TextEncoder, TextDecoder } from 'text-encoding';
import { getEndpoint } from './chains';
import { getAccount } from './eos';

const endpoint = getEndpoint('Telos');


const transferTelosToEVM = (fromTelosAccount, toEVMAddress, amount) => {
  const rpc = new JsonRpc(endpoint);
  const signatureProvider = new JsSignatureProvider([fromTelosAccount.privateKey]);

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
            to: 'eosio.evm',
            quantity: `${amount.toFixed(4)} TLOS`,
            toEVMAddress,
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

export {
	transferTelosToEVM,
}