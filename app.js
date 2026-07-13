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
    'matic-network': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png'
};

let currentPrices = {};
let updateInterval;

const coinGrid = document.getElementById('coin-grid');
const lastUpdateEl = document.getElementById('last-update');
const tradesBody = document.getElementById('trades-body');
const totalPnlEl = document.getElementById('total-pnl');

const tradeModal = document.getElementById('trade-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const tradeForm = document.getElementById('trade-form');

const coinIdInput = document.getElementById('coin-id');
const coinSymbolInput = document.getElementById('coin-symbol');
const buyPriceInput = document.getElementById('buy-price');
const sellPriceInput = document.getElementById('sell-price');
const amountInput = document.getElementById('amount');
const totalValueCalc = document.getElementById('total-value-calc');
const modalCoinImg = document.getElementById('modal-coin-img');
const modalCoinName = document.getElementById('modal-coin-name');
const modalCoinCurrentPrice = document.getElementById('modal-coin-current-price');

function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: amount < 1 ? 4 : 2
    }).format(amount);
}

function formatPercentage(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

function updateTotalValueCalc() {
    const amount = parseFloat(amountInput.value) || 0;
    const buyPrice = parseFloat(buyPriceInput.value) || 0;
    totalValueCalc.textContent = formatMoney(amount * buyPrice);
}

[amountInput, buyPriceInput].forEach(input => {
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
    amountInput.value = '';
    updateTotalValueCalc();

    tradeModal.classList.remove('hidden');
}

function closeModal() {
    tradeModal.classList.add('hidden');
    tradeForm.reset();
}

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
tradeModal.addEventListener('click', (e) => {
    if (e.target === tradeModal) closeModal();
});

function renderCoinCards(coinsData) {
    coinGrid.innerHTML = '';
    
    coinsData.forEach(coin => {
        currentPrices[coin.id] = coin.price;
        
        const changeClass = coin.change24h >= 0 ? 'change-up' : 'change-down';
        const iconUrl = COIN_ICONS[coin.id];
        
        const card = document.createElement('div');
        card.className = 'coin-card glass-panel';
        card.innerHTML = `
            <div class="coin-card-header">
                <img src="${iconUrl}" alt="${coin.name}" class="coin-icon">
                <div class="coin-name-group">
                    <h3>${coin.name}</h3>
                    <span class="coin-symbol">${coin.symbol}</span>
                </div>
            </div>
            <div class="coin-price">${formatMoney(coin.price)}</div>
            <div class="coin-change ${changeClass}">
                ${formatPercentage(coin.change24h)}
            </div>
        `;
        
        card.addEventListener('click', () => {
            openModal(coin.id, coin.name, coin.symbol, coin.price);
        });
        
        coinGrid.appendChild(card);
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
        
        let pnl, isCompleted;
        if (currentPrice >= trade.sellPrice && trade.status === 'active') {
             pnl = (trade.sellPrice - buyPrice) * amount;
             isCompleted = true;
             Storage.updateTradeStatus(trade.id, 'completed');
             trade.status = 'completed';
        } else if (trade.status === 'completed') {
            pnl = (trade.sellPrice - buyPrice) * amount;
            isCompleted = true;
        } else {
             pnl = (currentPrice - buyPrice) * amount;
             isCompleted = false;
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
            <td>${amount}</td>
            <td>${formatMoney(buyPrice)}</td>
            <td>${formatMoney(trade.sellPrice)}</td>
            <td>${formatMoney(currentPrice)}</td>
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

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if(confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
                Storage.removeTrade(id);
                renderTrades();
            }
        });
    });
}

async function updateMarketData() {
    lastUpdateEl.textContent = 'Güncelleniyor...';
    
    const data = await Api.fetchPrices();
    
    if (data) {
        renderCoinCards(data);
        renderTrades();
        
        const now = new Date();
        lastUpdateEl.textContent = `Son güncelleme: ${now.toLocaleTimeString()}`;
    } else {
        lastUpdateEl.textContent = 'Güncelleme hatası!';
    }
}

tradeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTrade = {
        coinId: coinIdInput.value,
        coinSymbol: coinSymbolInput.value,
        buyPrice: parseFloat(buyPriceInput.value),
        sellPrice: parseFloat(sellPriceInput.value),
        amount: parseFloat(amountInput.value)
    };
    
    Storage.addTrade(newTrade);
    closeModal();
    renderTrades();
});

async function init() {
    await updateMarketData();
    updateInterval = setInterval(updateMarketData, 30000);
}

document.addEventListener('DOMContentLoaded', init);
