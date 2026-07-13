const TARGET_COINS = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
    { id: 'binancecoin', symbol: 'bnb', name: 'Binance Coin' },
    { id: 'solana', symbol: 'sol', name: 'Solana' },
    { id: 'ripple', symbol: 'xrp', name: 'XRP' },
    { id: 'cardano', symbol: 'ada', name: 'Cardano' },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin' },
    { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche' },
    { id: 'polkadot', symbol: 'dot', name: 'Polkadot' },
    { id: 'matic-network', symbol: 'matic', name: 'Polygon' },
    { id: 'chainlink', symbol: 'link', name: 'Chainlink' },
    { id: 'uniswap', symbol: 'uni', name: 'Uniswap' },
    { id: 'the-open-network', symbol: 'ton', name: 'Toncoin' },
    { id: 'shiba-inu', symbol: 'shib', name: 'Shiba Inu' },
    { id: 'tron', symbol: 'trx', name: 'TRON' }
];

const COIN_IDS = TARGET_COINS.map(c => c.id).join(',');

class Api {
    static async fetchPrices() {
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS}&vs_currencies=usd&include_24hr_change=true`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('API Hatası');
            }
            
            const data = await response.json();
            
            const processedData = TARGET_COINS.map(coin => {
                const coinData = data[coin.id];
                return {
                    ...coin,
                    price: coinData ? coinData.usd : 0,
                    change24h: coinData ? coinData.usd_24h_change : 0,
                    image: `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`
                };
            });
            
            return processedData;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}
