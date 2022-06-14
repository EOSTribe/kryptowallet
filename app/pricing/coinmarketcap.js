import { log } from '../logger/logger';

const reqUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=EOS,TLOS,FIO,ALGO,XLM,ETH,BNB,MATIC';
const marketAPIKey = '815df99c-3be5-47bd-ba5b-0a9f988178d3';
// Default price values as of Jan 24, 2022
var defPriceData = {
  'EOS': 2.15,
  'TLOS': 0.5,
  'FIO': 0.1,
  'ALGO': 0.9,
  'XLM': 0.18,
  'ETH': 2350.0,
  'BNB': 400.0,
  'MATIC': 1.7,
  'AURORA': 3.48,
};

const getLatestPrices = async () => {
  try {
    var res = await fetch(reqUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-CMC_PRO_API_KEY': marketAPIKey,
      }
    });
    const resJson = await res.json();
    const eosPrice = resJson['data']['EOS']['quote']['USD']['price'];
    const tlosPrice = resJson['data']['TLOS']['quote']['USD']['price'];
    const fioPrice = resJson['data']['FIO']['quote']['USD']['price'];
    const algoPrice = resJson['data']['ALGO']['quote']['USD']['price'];
    const xlmPrice = resJson['data']['XLM']['quote']['USD']['price'];
    const ethPrice = resJson['data']['ETH']['quote']['USD']['price'];
    const bnbPrice = resJson['data']['BNB']['quote']['USD']['price'];
    const auroraPrice = resJson['data']['AURORA']['quote']['USD']['price'];
    const maticPrice = resJson['data']['MATIC']['quote']['USD']['price'];
    const newPriceData = {
      'EOS': eosPrice,
      'TLOS': tlosPrice,
      'FIO': fioPrice,
      'ALGO': algoPrice,
      'XLM': xlmPrice,
      'ETH': ethPrice,
      'BNB': bnbPrice,
      'MATIC': maticPrice,
      'AURORA': auroraPrice,
    };
    return newPriceData;
  } catch (err) {
    log({
      description: 'getLatestPrices load error',
      cause: err,
      location: 'coinmarketcap.js',
    });
  }
  return defPriceData;
};

export { getLatestPrices };
