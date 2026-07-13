const STORAGE_KEY = 'crypto_tracker_trades';
const BALANCE_KEY = 'crypto_tracker_balance';

class Storage {
    static getBalance() {
        const balance = localStorage.getItem(BALANCE_KEY);
        return balance ? parseFloat(balance) : 10000;
    }

    static updateBalance(amount) {
        const current = this.getBalance();
        const newBalance = current + amount;
        localStorage.setItem(BALANCE_KEY, newBalance.toString());
        return newBalance;
    }

    static setBalance(amount) {
        localStorage.setItem(BALANCE_KEY, amount.toString());
        return amount;
    }

    static getTrades() {
        const trades = localStorage.getItem(STORAGE_KEY);
        return trades ? JSON.parse(trades) : [];
    }

    static addTrade(trade) {
        const trades = this.getTrades();
        
        const newTrade = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            status: 'active',
            ...trade
        };
        
        trades.push(newTrade);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
        return newTrade;
    }

    static removeTrade(id) {
        const trades = this.getTrades();
        const filteredTrades = trades.filter(trade => trade.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTrades));
    }

    static updateTradeStatus(id, newStatus) {
        const trades = this.getTrades();
        const updatedTrades = trades.map(trade => {
            if (trade.id === id) {
                return { ...trade, status: newStatus };
            }
            return trade;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrades));
    }
}
