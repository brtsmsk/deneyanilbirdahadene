const TARGET_COINS = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', stream: 'btcusdt' },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', stream: 'ethusdt' },
    { id: 'binancecoin', symbol: 'bnb', name: 'Binance Coin', stream: 'bnbusdt' },
    { id: 'solana', symbol: 'sol', name: 'Solana', stream: 'solusdt' },
    { id: 'ripple', symbol: 'xrp', name: 'XRP', stream: 'xrpusdt' },
    { id: 'cardano', symbol: 'ada', name: 'Cardano', stream: 'adausdt' },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', stream: 'dogeusdt' },
    { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', stream: 'avaxusdt' },
    { id: 'polkadot', symbol: 'dot', name: 'Polkadot', stream: 'dotusdt' },
    { id: 'polygon-ecosystem-token', symbol: 'pol', name: 'Polygon', stream: 'maticusdt' },
    { id: 'chainlink', symbol: 'link', name: 'Chainlink', stream: 'linkusdt' },
    { id: 'uniswap', symbol: 'uni', name: 'Uniswap', stream: 'uniusdt' },
    { id: 'the-open-network', symbol: 'ton', name: 'Toncoin', stream: 'tonusdt' },
    { id: 'shiba-inu', symbol: 'shib', name: 'Shiba Inu', stream: 'shibusdt' },
    { id: 'tron', symbol: 'trx', name: 'TRON', stream: 'trxusdt' }
];

class BinanceSocket {
    constructor(onUpdateCallback) {
        this.onUpdateCallback = onUpdateCallback;
        this.socket = null;
        this.prices = {}; // Bellekte son fiyatları tutalım
        
        // Başlangıç verilerini sıfırla
        TARGET_COINS.forEach(coin => {
            this.prices[coin.id] = {
                ...coin,
                price: 0,
                change24h: 0
            };
        });
    }

    connect() {
        const streams = TARGET_COINS.map(c => `${c.stream}@ticker`).join('/');
        const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
        
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
            console.log("Binance WebSocket bağlandı.");
            if (this.onStatusChange) this.onStatusChange('connected');
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.data) {
                const data = message.data;
                const streamName = message.stream.split('@')[0];
                
                // Hangi coin olduğunu bul
                const coin = TARGET_COINS.find(c => c.stream === streamName);
                if (coin) {
                    this.prices[coin.id] = {
                        ...coin,
                        price: parseFloat(data.c), // c: current close price
                        change24h: parseFloat(data.P) // P: price change percent
                    };
                    
                    // Callback'i tüm coinlerin güncel haliyle tetikle
                    this.onUpdateCallback(Object.values(this.prices));
                }
            }
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket Hatası:", error);
            if (this.onStatusChange) this.onStatusChange('error');
        };

        this.socket.onclose = () => {
            console.log("WebSocket kapandı. Yeniden bağlanılıyor...");
            if (this.onStatusChange) this.onStatusChange('disconnected');
            setTimeout(() => this.connect(), 3000);
        };
    }
}
