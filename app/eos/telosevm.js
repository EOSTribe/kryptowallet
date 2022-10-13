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
  // Check if address registered in eosio.evm contract:
  let address = toEVMAddress;
  if (address.startsWith('0x')) address = address.substring(2);
  address = address.toLowerCase();
  const paddedAddress = '0'.repeat(12 * 2) + address;
  // Query account table 
  const { rows } = await this.getTable({
      code: this.telosContract,
      scope: this.telosContract,
      table: 'account',
      key_type: 'sha256',
      index_position: 2,
      lower_bound: paddedAddress,
      upper_bound: paddedAddress,
      limit: 1
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