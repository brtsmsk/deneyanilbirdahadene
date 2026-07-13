const STORAGE_KEY = 'crypto_tracker_trades';
const BALANCE_KEY = 'crypto_tracker_balance';
const BOT_RULES_KEY = 'crypto_tracker_bot_rules';

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

    static getBotRules() {
        const rules = localStorage.getItem(BOT_RULES_KEY);
        return rules ? JSON.parse(rules) : [];
    }

    static addBotRule(rule) {
        const rules = this.getBotRules();
        const newRule = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            status: 'waiting_to_buy', // 'waiting_to_buy', 'waiting_to_sell', 'paused'
            ...rule
        };
        rules.push(newRule);
        localStorage.setItem(BOT_RULES_KEY, JSON.stringify(rules));
        return newRule;
    }

    static removeBotRule(id) {
        let rules = this.getBotRules();
        rules = rules.filter(r => r.id !== id);
        localStorage.setItem(BOT_RULES_KEY, JSON.stringify(rules));
    }

    static updateBotRuleStatus(id, newStatus) {
        const rules = this.getBotRules();
        const rule = rules.find(r => r.id === id);
        if (rule) {
            rule.status = newStatus;
            localStorage.setItem(BOT_RULES_KEY, JSON.stringify(rules));
        }
    }
}
