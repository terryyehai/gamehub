/* ============================================
   接龍遊戲 (Solitaire)
   ============================================ */
let solitaireDeck = [];
let tableau = [[], [], [], [], [], [], []];
let foundation = [[], [], [], []];
let stock = [];
let waste = [];
let selectedCard = null;
let canvasSol, ctxSol;
let cardWidth = 70;
let cardHeight = 100;

const suits = ['♠', '♥', '♦', '♣'];
const colors = { '♠': '#fff', '♥': '#ff4444', '♦': '#ff4444', '♣': '#fff' };

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="solitaire-container">
            <div class="sol-top">
                <div class="stock-waste">
                    <div class="stock" id="stock" onclick="drawCard()"></div>
                    <div class="waste" id="waste"></div>
                </div>
                <div class="foundations" id="foundations"></div>
            </div>
            <div class="tableau" id="tableau"></div>
            <button class="new-game-btn" onclick="initSolitaire()">新遊戲</button>
        </div>
    `;
    
    initSolitaire();
}

function initSolitaire() {
    // 創建牌組
    solitaireDeck = [];
    for (const suit of suits) {
        for (let rank = 1; rank <= 13; rank++) {
            solitaireDeck.push({ suit, rank, faceUp: false });
        }
    }
    
    // 洗牌
    for (let i = solitaireDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [solitaireDeck[i], solitaireDeck[j]] = [solitaireDeck[j], solitaireDeck[i]];
    }
    
    // 發牌
    tableau = [[], [], [], [], [], [], []];
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            const card = solitaireDeck.pop();
            if (row === col) card.faceUp = true;
            tableau[col].push(card);
        }
    }
    
    // 牌堆
    stock = [...solitaireDeck];
    waste = [];
    foundation = [[], [], [], []];
    selectedCard = null;
    
    renderSolitaire();
    sound.button();
}

function renderSolitaire() {
    // 牌堆
    const stockEl = document.getElementById('stock');
    stockEl.innerHTML = stock.length > 0 ? '🃏' : '↻';
    stockEl.style.cursor = stock.length > 0 ? 'pointer' : 'default';
    
    // 廢牌堆
    const wasteEl = document.getElementById('waste');
    wasteEl.innerHTML = waste.length > 0 ? renderCard(waste[waste.length - 1]) : '';
    
    //  foundations
    const foundationsEl = document.getElementById('foundations');
    foundationsEl.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const fDiv = document.createElement('div');
        fDiv.className = 'foundation';
        fDiv.dataset.suit = suits[i];
        fDiv.innerHTML = foundation[i].length > 0 ? renderCard(foundation[i][foundation[i].length - 1]) : suits[i];
        foundationsEl.appendChild(fDiv);
    }
    
    // 牌桌
    const tableauEl = document.getElementById('tableau');
    tableauEl.innerHTML = '';
    
    for (let col = 0; col < 7; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'tableau-col';
        colDiv.dataset.col = col;
        
        tableau[col].forEach((card, idx) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'tableau-card' + (card.faceUp ? ' face-up' : '');
            cardDiv.style.top = (idx * 25) + 'px';
            cardDiv.innerHTML = card.faceUp ? renderCard(card) : '';
            colDiv.appendChild(cardDiv);
        });
        
        tableauEl.appendChild(colDiv);
    }
    
    // 綁定事件
    document.querySelectorAll('.tableau-card.face-up').forEach(el => {
        el.onclick = (e) => handleCardClick(el, e);
    });
}

function renderCard(card) {
    const color = colors[card.suit];
    const rankStr = getRankSymbol(card.rank);
    return `<div class="card" style="color:${color}">
        <div class="card-top">${rankStr}${card.suit}</div>
        <div class="card-center">${card.suit}</div>
        <div class="card-bottom">${rankStr}${card.suit}</div>
    </div>`;
}

function getRankSymbol(rank) {
    const symbols = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
    return symbols[rank] || rank;
}

function drawCard() {
    if (stock.length > 0) {
        const card = stock.pop();
        card.faceUp = true;
        waste.push(card);
    } else {
        // 回收廢牌
        while (waste.length > 0) {
            const card = waste.pop();
            card.faceUp = false;
            stock.push(card);
        }
    }
    renderSolitaire();
    sound.click();
}

function handleCardClick(el, e) {
    // 實現點擊移動邏輯
    sound.click();
}

// 樣式
const solStyle = document.createElement('style');
solStyle.textContent = `
    .solitaire-container { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
    .sol-top { display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .stock-waste { display: flex; gap: 0.5rem; }
    .stock, .waste, .foundation {
        width: 70px; height: 100px;
        background: var(--secondary);
        border: 2px solid var(--card-border);
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 2rem;
    }
    .foundations { display: flex; gap: 0.5rem; }
    .tableau { display: flex; gap: 0.5rem; justify-content: center; }
    .tableau-col {
        position: relative; width: 70px; height: 400px;
    }
    .tableau-card {
        position: absolute; width: 70px; height: 100px;
        background: var(--secondary);
        border: 1px solid var(--card-border);
        border-radius: 6px;
    }
    .tableau-card.face-up { background: #fff; color: #000; }
    .card { width: 100%; height: 100%; padding: 5px; font-weight: bold; }
    .card-top, .card-bottom { font-size: 0.8rem; }
    .card-center { font-size: 1.5rem; text-align: center; }
    .new-game-btn {
        background: var(--accent); border: none; color: var(--primary);
        padding: 0.8rem 2rem; border-radius: 8px; font-size: 1rem;
        cursor: pointer; align-self: center;
    }
`;
document.head.appendChild(solStyle);
