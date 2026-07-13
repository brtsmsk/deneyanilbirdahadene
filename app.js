const COIN_ICONS = {
    'bitcoin': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    'ethereum': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    'binancecoin': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    'solana': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    'ripple': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    'cardano': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    'dogecoin': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    'avalanche-2': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    'polkadot': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
    'polygon-ecosystem-token': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    'chainlink': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    'uniswap': 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
    'the-open-network': 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
    'shiba-inu': 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
    'tron': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png'
};

let currentPrices = {};
let updateInterval;

const coinGrid = document.getElementById('coin-grid');
const lastUpdateEl = document.getElementById('last-update');
const tradesBody = document.getElementById('trades-body');
const totalPnlEl = document.getElementById('total-pnl');
const walletBalanceEl = document.getElementById('wallet-balance');
const walletBtn = document.getElementById('wallet-btn');

const tradeModal = document.getElementById('trade-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const tradeForm = document.getElementById('trade-form');

const orderTypeRadios = document.querySelectorAll('input[name="order-type"]');
const botSettings = document.getElementById('bot-settings');
const botRecurringInput = document.getElementById('bot-recurring');
const modalSubmitBtn = document.getElementById('modal-submit-btn');

const coinIdInput = document.getElementById('coin-id');
const coinSymbolInput = document.getElementById('coin-symbol');
const buyPriceInput = document.getElementById('buy-price');
const sellPriceInput = document.getElementById('sell-price');
const investmentInput = document.getElementById('investment');
const totalValueCalc = document.getElementById('total-value-calc');
const modalCoinImg = document.getElementById('modal-coin-img');
const modalCoinName = document.getElementById('modal-coin-name');
const modalCoinCurrentPrice = document.getElementById('modal-coin-current-price');

function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: amount < 1 && amount > 0 ? 4 : 2
    }).format(amount);
}

function renderBalance() {
    walletBalanceEl.textContent = formatMoney(Storage.getBalance());
}

walletBtn.addEventListener('click', () => {
    const current = Storage.getBalance();
    const newBalanceStr = prompt('Yeni kasa bakiyenizi girin ($):', current);
    if (newBalanceStr !== null) {
        const newBalance = parseFloat(newBalanceStr);
        if (!isNaN(newBalance) && newBalance >= 0) {
            Storage.setBalance(newBalance);
            renderBalance();
        } else {
            alert('Geçersiz bir tutar girdiniz.');
        }
    }
});

function formatPercentage(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

function updateTotalValueCalc() {
    const investment = parseFloat(investmentInput.value) || 0;
    const buyPrice = parseFloat(buyPriceInput.value) || 0;
    let coinAmount = 0;
    if (buyPrice > 0) {
        coinAmount = investment / buyPrice;
    }
    totalValueCalc.textContent = coinAmount.toFixed(6) + ' Adet';
}

[investmentInput, buyPriceInput].forEach(input => {
    input.addEventListener('input', updateTotalValueCalc);
});

function openModal(coinId, coinName, coinSymbol, currentPrice) {
    coinIdInput.value = coinId;
    coinSymbolInput.value = coinSymbol;
    modalCoinName.textContent = coinName;
    modalCoinImg.src = COIN_ICONS[coinId];
    modalCoinCurrentPrice.textContent = formatMoney(currentPrice);
    
    buyPriceInput.value = currentPrice;
    sellPriceInput.value = currentPrice * 1.05;
    investmentInput.value = '';
    updateTotalValueCalc();

    // Reset modal state
    document.querySelector('input[name="order-type"][value="market"]').checked = true;
    botSettings.style.display = 'none';
    modalSubmitBtn.textContent = 'İşlemi Kaydet';

    tradeModal.classList.remove('hidden');
}

function closeModal() {
    tradeModal.classList.add('hidden');
    tradeForm.reset();
}

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

orderTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'bot') {
            botSettings.style.display = 'block';
            modalSubmitBtn.textContent = 'Pusu Kur';
        } else {
            botSettings.style.display = 'none';
            modalSubmitBtn.textContent = 'İşlemi Kaydet';
        }
    });
});

window.addEventListener('click', (e) => {
    if (e.target === tradeModal) closeModal();
});

function renderCoinCards(coinsData) {
    const loadingState = document.querySelector('.loading-state');
    if (loadingState) loadingState.remove();

    coinsData.forEach(coin => {
        currentPrices[coin.id] = coin.price;
        
        let card = document.getElementById(`card-${coin.id}`);
        
        if (!card) {
            const iconUrl = COIN_ICONS[coin.id];
            card = document.createElement('div');
            card.id = `card-${coin.id}`;
            card.className = 'coin-card glass-panel';
            card.innerHTML = `
                <div class="coin-card-header">
                    <img src="${iconUrl}" alt="${coin.name}" class="coin-icon">
                    <div class="coin-name-group">
                        <h3>${coin.name}</h3>
                        <span class="coin-symbol">${coin.symbol}</span>
                    </div>
                </div>
                <div class="coin-price" id="price-${coin.id}">${formatMoney(coin.price)}</div>
                <div class="coin-change" id="change-${coin.id}">
                    ${formatPercentage(coin.change24h)}
                </div>
            `;
            
            card.addEventListener('click', () => {
                openModal(coin.id, coin.name, coin.symbol, currentPrices[coin.id]);
            });
            
            coinGrid.appendChild(card);
        } else {
            document.getElementById(`price-${coin.id}`).textContent = formatMoney(coin.price);
            const changeEl = document.getElementById(`change-${coin.id}`);
            changeEl.textContent = formatPercentage(coin.change24h);
            changeEl.className = `coin-change ${coin.change24h >= 0 ? 'change-up' : 'change-down'}`;
        }
    });
}

function renderTrades() {
    const trades = Storage.getTrades();
    tradesBody.innerHTML = '';
    let totalPnl = 0;

    if (trades.length === 0) {
        tradesBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="8">Henüz işlem bulunmuyor. Bir coin seçerek işlem ekleyebilirsiniz.</td>
            </tr>
        `;
        totalPnlEl.textContent = formatMoney(0);
        totalPnlEl.className = 'stat-value neutral';
        return;
    }

    trades.forEach(trade => {
        const currentPrice = currentPrices[trade.coinId] || trade.buyPrice;
        const amount = parseFloat(trade.amount);
        const buyPrice = parseFloat(trade.buyPrice);
        
        const tradeType = trade.type || 'long';
        
        let pnl, isCompleted;
        if (tradeType === 'long') {
            if (currentPrice >= trade.sellPrice && trade.status === 'active') {
                 pnl = (trade.sellPrice - buyPrice) * amount;
                 isCompleted = true;
                 Storage.updateTradeStatus(trade.id, 'completed');
                 Storage.updateBalance((buyPrice * amount) + pnl);
                 trade.status = 'completed';
            } else if (trade.status === 'completed') {
                pnl = (trade.sellPrice - buyPrice) * amount;
                isCompleted = true;
            } else {
                 pnl = (currentPrice - buyPrice) * amount;
                 isCompleted = false;
            }
        } else {
            if (currentPrice <= trade.sellPrice && trade.status === 'active') {
                 pnl = (buyPrice - trade.sellPrice) * amount;
                 isCompleted = true;
                 Storage.updateTradeStatus(trade.id, 'completed');
                 Storage.updateBalance((buyPrice * amount) + pnl);
                 trade.status = 'completed';
            } else if (trade.status === 'completed') {
                pnl = (buyPrice - trade.sellPrice) * amount;
                isCompleted = true;
            } else {
                 pnl = (buyPrice - currentPrice) * amount;
                 isCompleted = false;
            }
        }

        totalPnl += pnl;

        const pnlClass = pnl >= 0 ? 'change-up' : 'change-down';
        const pnlSign = pnl >= 0 ? '+' : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="table-coin-cell">
                    <img src="${COIN_ICONS[trade.coinId]}" class="table-coin-icon">
                    ${trade.coinSymbol.toUpperCase()}
                </div>
            </td>
            <td>${formatMoney(buyPrice * amount)}</td>
            <td>${formatMoney(buyPrice)}</td>
            <td>${formatMoney(trade.sellPrice)}</td>
            <td>${formatMoney(currentPrice)}</td>
            <td><span class="status-badge" style="background: ${tradeType === 'long' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${tradeType === 'long' ? '#34D399' : '#F87171'}">${tradeType.toUpperCase()}</span></td>
            <td class="${pnlClass}">${pnlSign}${formatMoney(pnl)}</td>
            <td>
                <span class="status-badge ${isCompleted ? 'status-completed' : 'status-active'}">
                    ${isCompleted ? 'Hedefe Ulaştı' : 'Aktif'}
                </span>
            </td>
            <td>
                <button class="action-btn delete-btn" data-id="${trade.id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                </button>
            </td>
        `;
        tradesBody.appendChild(tr);
    });

    totalPnlEl.textContent = `${totalPnl >= 0 ? '+' : ''}${formatMoney(totalPnl)}`;
    if (totalPnl > 0) totalPnlEl.className = 'stat-value positive';
    else if (totalPnl < 0) totalPnlEl.className = 'stat-value negative';
    else totalPnlEl.className = 'stat-value neutral';
}

tradesBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-btn');
    if (btn) {
        const id = btn.getAttribute('data-id');
        if(confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
            const allTrades = Storage.getTrades();
            const tradeToDelete = allTrades.find(t => t.id === id);
            if (tradeToDelete && tradeToDelete.status === 'active') {
                const currentPrice = currentPrices[tradeToDelete.coinId] || tradeToDelete.buyPrice;
                const amount = parseFloat(tradeToDelete.amount);
                const buyPrice = parseFloat(tradeToDelete.buyPrice);
                const tradeType = tradeToDelete.type || 'long';
                
                let pnl;
                if (tradeType === 'long') {
                    pnl = (currentPrice - buyPrice) * amount;
                } else {
                    pnl = (buyPrice - currentPrice) * amount;
                }
                
                Storage.updateBalance((buyPrice * amount) + pnl);
                
                // Bot kontrolü: Eğer bu işlem bir bota bağlıysa ve bot tekrarlıysa onu serbest bırak
                if (tradeToDelete.linkedBotRuleId) {
                    const botRules = Storage.getBotRules();
                    const linkedBot = botRules.find(b => b.id === tradeToDelete.linkedBotRuleId);
                    if (linkedBot && linkedBot.isRecurring) {
                        Storage.updateBotRuleStatus(linkedBot.id, 'waiting_to_buy');
                        renderBotRules();
                    }
                }
            }
            Storage.removeTrade(id);
            renderTrades();
            renderBalance();
        }
    }
});

tradeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const buyPrice = parseFloat(buyPriceInput.value);
    const investment = parseFloat(investmentInput.value);
    const orderType = document.querySelector('input[name="order-type"]:checked').value;
    const tradeType = document.querySelector('input[name="trade-type"]:checked').value;
    
    if (orderType === 'bot') {
        // Bot Kuralı Ekle (Para şimdi düşmez, tetiklenince düşer)
        Storage.addBotRule({
            coinId: coinIdInput.value,
            coinSymbol: coinSymbolInput.value,
            buyPrice: buyPrice,
            sellPrice: parseFloat(sellPriceInput.value),
            investment: investment,
            type: tradeType,
            isRecurring: botRecurringInput.checked
        });
        renderBotRules();
    } else {
        // Normal İşlem Ekle
        const cost = investment;
        const currentBalance = Storage.getBalance();
        if (cost > currentBalance) {
            alert('Yetersiz bakiye! Kasanızda bu işlem için yeterli tutar bulunmuyor.');
            return;
        }
        
        Storage.updateBalance(-cost);
        renderBalance();
        
        const amount = investment / buyPrice;
        
        Storage.addTrade({
            coinId: coinIdInput.value,
            coinSymbol: coinSymbolInput.value,
            buyPrice: buyPrice,
            sellPrice: parseFloat(sellPriceInput.value),
            amount: amount,
            type: tradeType
        });
        renderTrades();
    }
    
    closeModal();
});

const botsBody = document.getElementById('bots-body');

function renderBotRules() {
    const rules = Storage.getBotRules();
    botsBody.innerHTML = '';

    if (rules.length === 0) {
        botsBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-state">Henüz bekleyen otomatik bir bot kuralı yok.</td>
            </tr>
        `;
        return;
    }

    rules.forEach(rule => {
        const tr = document.createElement('tr');
        
        let statusBadge = '';
        if (rule.status === 'waiting_to_buy') statusBadge = '<span style="color: var(--neon-blue);">Alım Bekliyor ⏳</span>';
        else if (rule.status === 'waiting_to_sell') statusBadge = '<span style="color: var(--neon-green);">Satış Bekliyor (İşlemde) 📈</span>';
        else statusBadge = '<span style="color: var(--text-muted);">Durduruldu 🛑</span>';

        tr.innerHTML = `
            <td>
                <div class="table-coin-cell">
                    <img src="${COIN_ICONS[rule.coinId]}" class="table-coin-icon">
                    ${rule.coinSymbol.toUpperCase()}
                </div>
            </td>
            <td>${formatMoney(rule.investment)}</td>
            <td>${formatMoney(rule.buyPrice)}</td>
            <td>${formatMoney(rule.sellPrice)}</td>
            <td>${rule.isRecurring ? 'Tekrarlı 🔄' : 'Tek Seferlik 1️⃣'}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="delete-bot-btn" data-id="${rule.id}">Sil</button>
            </td>
        `;
        botsBody.appendChild(tr);
    });
}

botsBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-bot-btn');
    if (btn) {
        const id = btn.getAttribute('data-id');
        if(confirm('Bu bot kuralını silmek istediğinize emin misiniz? (Mevcut açık işlemleri etkilemez)')) {
            Storage.removeBotRule(id);
            renderBotRules();
        }
    }
});

function checkBotRules() {
    const rules = Storage.getBotRules();
    let rulesUpdated = false;
    let tradesUpdated = false;

    rules.forEach(rule => {
        if (rule.status === 'waiting_to_buy') {
            const currentPrice = currentPrices[rule.coinId];
            if (currentPrice && currentPrice <= rule.buyPrice) {
                // Fiyat düştü, alım yap!
                const currentBalance = Storage.getBalance();
                if (rule.investment <= currentBalance) {
                    // Bakiyeden düş
                    Storage.updateBalance(-rule.investment);
                    
                    // İşlem aç
                    const amount = rule.investment / rule.buyPrice;
                    Storage.addTrade({
                        coinId: rule.coinId,
                        coinSymbol: rule.coinSymbol,
                        buyPrice: rule.buyPrice,
                        sellPrice: rule.sellPrice,
                        amount: amount,
                        type: rule.type,
                        linkedBotRuleId: rule.id // Bağlantıyı kurduk
                    });
                    
                    Storage.updateBotRuleStatus(rule.id, 'waiting_to_sell');
                    rulesUpdated = true;
                    tradesUpdated = true;
                }
            }
        }
    });

    if (rulesUpdated) renderBotRules();
    if (tradesUpdated) {
        renderTrades();
        renderBalance();
    }
}

function handleSocketUpdate(coinsData) {
    const now = Date.now();
    
    // Fiyatları güncelle
    coinsData.forEach(c => {
        if (c.price > 0) currentPrices[c.id] = c.price;
    });

    // Her saniye botları kontrol et
    checkBotRules();
    
    // UI Güncellemesini saniyede maks 2 kez yap (500ms throttle)
    if (now - lastRenderTime > 500) {
        const validData = coinsData.filter(c => c.price > 0);
        if (validData.length > 0) {
            renderCoinCards(validData);
            renderTrades();
            lastRenderTime = now;
        }
    }
}

function init() {
    renderBalance();
    renderTrades();
    renderBotRules();
    
    const wsApi = new BinanceSocket(handleSocketUpdate);
    wsApi.onStatusChange = (status) => {
        if (status === 'connected') {
            lastUpdateEl.textContent = 'Canlı 🟢';
            lastUpdateEl.style.color = 'var(--neon-green)';
        } else if (status === 'disconnected') {
            lastUpdateEl.textContent = 'Bağlantı koptu, yeniden deneniyor...';
            lastUpdateEl.style.color = 'var(--neon-red)';
        } else if (status === 'error') {
            lastUpdateEl.textContent = 'Bağlantı hatası!';
            lastUpdateEl.style.color = 'var(--neon-red)';
        }
    };
    
    lastUpdateEl.textContent = 'Bağlanıyor...';
    wsApi.connect();
}

document.addEventListener('DOMContentLoaded', init);
