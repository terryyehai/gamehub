(function() {
/* ============================================
   接龍遊戲 (Solitaire / Klondike)
   ============================================ */
let solitaireDeck = [];
let tableau = [[], [], [], [], [], [], []];
let foundation = [[], [], [], []];
let stock = [];
let waste = [];
let selectedCard = null;
let selectedSource = null; // { type: 'tableau'|'waste'|'foundation', col: number, index: number }

const suits = ['♠', '♥', '♦', '♣'];
const suitColors = { '♠': '#000', '♥': '#d00', '♦': '#d00', '♣': '#000' };

function cleanup() {
    // Cleanup
}

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
            <div class="sol-controls">
                <button class="sol-btn" onclick="initSolitaire()">🔄 新遊戲</button>
                <button class="sol-btn" onclick="autoComplete()">🏆 自動完成</button>
            </div>
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
    selectedSource = null;
    
    renderSolitaire();
    sound.button();
}

function renderSolitaire() {
    const stockEl = document.getElementById('stock');
    const wasteEl = document.getElementById('waste');
    const foundationsEl = document.getElementById('foundations');
    const tableauEl = document.getElementById('tableau');
    
    // 牌堆
    stockEl.innerHTML = stock.length > 0 ? '🃏' : '↻';
    stockEl.style.cursor = stock.length > 0 ? 'pointer' : 'default';
    
    // 廢牌堆
    if (waste.length > 0) {
        const topCard = waste[waste.length - 1];
        wasteEl.innerHTML = renderCardHTML(topCard);
        wasteEl.onclick = () => selectCard('waste', 0, waste.length - 1);
        wasteEl.style.cursor = 'pointer';
    } else {
        wasteEl.innerHTML = '';
        wasteEl.onclick = null;
        wasteEl.style.cursor = 'default';
    }
    
    // Foundations
    foundationsEl.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const fDiv = document.createElement('div');
        fDiv.className = 'foundation';
        fDiv.innerHTML = suits[i];
        fDiv.onclick = () => selectCard('foundation', i, foundation[i].length - 1);
        
        if (foundation[i].length > 0) {
            const topCard = foundation[i][foundation[i].length - 1];
            fDiv.innerHTML = renderCardHTML(topCard);
        }
        
        foundationsEl.appendChild(fDiv);
    }
    
    // Tableau
    tableauEl.innerHTML = '';
    for (let col = 0; col < 7; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'tableau-col';
        
        tableau[col].forEach((card, idx) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'tableau-card';
            if (card.faceUp) {
                cardDiv.innerHTML = renderCardHTML(card);
                cardDiv.onclick = () => selectCard('tableau', col, idx);
                cardDiv.style.cursor = 'pointer';
            } else {
                cardDiv.classList.add('face-down');
                cardDiv.innerHTML = '🃏';
            }
            
            if (selectedSource && selectedSource.type === 'tableau' && 
                selectedSource.col === col && selectedSource.index === idx) {
                cardDiv.classList.add('selected');
            }
            
            cardDiv.style.top = (idx * 25) + 'px';
            colDiv.appendChild(cardDiv);
        });
        
        tableauEl.appendChild(colDiv);
    }
}

function renderCardHTML(card) {
    if (!card) return '';
    const color = suitColors[card.suit];
    const rankStr = getRankSymbol(card.rank);
    return `<div class="card" style="color:${color}">
        <div class="card-top">${rankStr}${card.suit}</div>
        <div class="card-center">${card.suit}</div>
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
    } else if (waste.length > 0) {
        // 回收廢牌
        while (waste.length > 0) {
            const card = waste.pop();
            card.faceUp = false;
            stock.push(card);
        }
    }
    selectedSource = null;
    renderSolitaire();
    sound.click();
}

function selectCard(type, col, index) {
    // 如果已經選中一張牌，嘗試移動
    if (selectedSource) {
        // 取消選擇
        if (selectedSource.type === type && selectedSource.col === col && selectedSource.index === index) {
            selectedSource = null;
            renderSolitaire();
            return;
        }
        
        // 嘗試移動
        if (tryMove(type, col, index)) {
            selectedSource = null;
            renderSolitaire();
            return;
        }
    }
    
    // 選中新牌
    let card;
    if (type === 'waste') {
        card = waste[waste.length - 1];
    } else if (type === 'tableau') {
        card = tableau[col][index];
        // 只能選已經翻開的牌
        if (!card.faceUp) {
            selectedSource = null;
            return;
        }
    } else if (type === 'foundation') {
        card = foundation[col][index];
    }
    
    if (card) {
        selectedSource = { type, col, index };
        sound.click();
    }
    renderSolitaire();
}

function tryMove(targetType, targetCol, targetIndex) {
    if (!selectedSource) return false;
    
    const sourceCard = getSelectedCard();
    if (!sourceCard) return false;
    
    let targetCard;
    if (targetType === 'tableau') {
        targetCard = tableau[targetCol][targetIndex];
    } else if (targetType === 'foundation') {
        targetCard = foundation[targetCol][targetIndex];
    }
    
    // 移動到 Tableau
    if (targetType === 'tableau') {
        // 空列可以放任何牌
        if (tableau[targetCol].length === 0) {
            if (sourceCard.rank === 13) { // K can go anywhere
                moveCardToTableau(targetCol);
                return true;
            }
            return false;
        }
        
        // 非空列：必須交替顏色，小的壓大的
        const topCard = tableau[targetCol][tableau[targetCol].length - 1];
        if (topCard && isOppositeColor(sourceCard.suit, topCard.suit) && 
            sourceCard.rank === topCard.rank - 1) {
            moveCardToTableau(targetCol);
            return true;
        }
    }
    
    // 移動到 Foundation
    if (targetType === 'foundation') {
        // 必須同花色，由小到大
        if (foundation[targetCol].length === 0) {
            if (sourceCard.rank === 1) { // A starts foundation
                moveCardToFoundation(targetCol);
                return true;
            }
        } else {
            const topCard = foundation[targetCol][foundation[targetCol].length - 1];
            if (topCard && sourceCard.suit === topCard.suit && 
                sourceCard.rank === topCard.rank + 1) {
                moveCardToFoundation(targetCol);
                return true;
            }
        }
    }
    
    return false;
}

function getSelectedCard() {
    if (!selectedSource) return null;
    
    if (selectedSource.type === 'waste') {
        return waste[waste.length - 1];
    } else if (selectedSource.type === 'tableau') {
        return tableau[selectedSource.col][selectedSource.index];
    } else if (selectedSource.type === 'foundation') {
        return foundation[selectedSource.col][selectedSource.index];
    }
    return null;
}

function moveCardToTableau(targetCol) {
    if (!selectedSource) return;
    
    let cards = [];
    
    if (selectedSource.type === 'waste') {
        cards = [waste.pop()];
    } else if (selectedSource.type === 'tableau') {
        const col = selectedSource.col;
        cards = tableau[col].slice(selectedSource.index);
        tableau[col] = tableau[col].slice(0, selectedSource.index);
        
        // 翻開下一張
        if (tableau[col].length > 0) {
            tableau[col][tableau[col].length - 1].faceUp = true;
        }
    } else if (selectedSource.type === 'foundation') {
        cards = [foundation[selectedSource.col].pop()];
    }
    
    tableau[targetCol].push(...cards);
    sound.move();
}

function moveCardToFoundation(targetCol) {
    if (!selectedSource) return;
    
    let card;
    
    if (selectedSource.type === 'waste') {
        card = waste.pop();
    } else if (selectedSource.type === 'tableau') {
        const col = selectedSource.col;
        card = tableau[col].pop();
        
        // 翻開下一張
        if (tableau[col].length > 0) {
            tableau[col][tableau[col].length - 1].faceUp = true;
        }
    } else if (selectedSource.type === 'foundation') {
        card = foundation[selectedSource.col].pop();
    }
    
    foundation[targetCol].push(card);
    sound.success();
    
    // 檢查是否完成
    checkWin();
}

function isOppositeColor(suit1, suit2) {
    return (suit1 === '♥' || suit1 === '♦') !== (suit2 === '♥' || suit2 === '♦');
}

function checkWin() {
    let total = 0;
    for (let i = 0; i < 4; i++) {
        total += foundation[i].length;
    }
    if (total === 52) {
        setTimeout(() => {
            try { alert('🎉 恭喜過關！'); } catch(e) {}
            sound.win();
        }, 100);
    }
}

function autoComplete() {
    // 簡單的自動完成：嘗試把所有牌移到 foundation
    let moved = true;
    while (moved) {
        moved = false;
        
        // 從 waste 開始
        if (waste.length > 0) {
            const card = waste[waste.length - 1];
            for (let i = 0; i < 4; i++) {
                if (foundation[i].length === 0 && card.rank === 1) {
                    foundation[i].push(waste.pop());
                    moved = true;
                    break;
                } else if (foundation[i].length > 0) {
                    const top = foundation[i][foundation[i].length - 1];
                    if (card.suit === top.suit && card.rank === top.rank + 1) {
                        foundation[i].push(waste.pop());
                        moved = true;
                        break;
                    }
                }
            }
        }
        
        // 從 tableau
        for (let col = 0; col < 7; col++) {
            if (tableau[col].length > 0) {
                const card = tableau[col][tableau[col].length - 1];
                if (card.faceUp) {
                    for (let i = 0; i < 4; i++) {
                        if (foundation[i].length === 0 && card.rank === 1) {
                            foundation[i].push(tableau[col].pop());
                            if (tableau[col].length > 0) {
                                tableau[col][tableau[col].length - 1].faceUp = true;
                            }
                            moved = true;
                            break;
                        } else if (foundation[i].length > 0) {
                            const top = foundation[i][foundation[i].length - 1];
                            if (card.suit === top.suit && card.rank === top.rank + 1) {
                                foundation[i].push(tableau[col].pop());
                                if (tableau[col].length > 0) {
                                    tableau[col][tableau[col].length - 1].faceUp = true;
                                }
                                moved = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    renderSolitaire();
    checkWin();
}

// 樣式
const solStyle = document.createElement('style');
solStyle.textContent = `
    .solitaire-container { 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        padding: 0.5rem; 
        width: 100%;
        min-width: 300px;
    }
    .sol-top { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 0.5rem; 
        width: 100%; 
        max-width: 450px; 
    }
    .stock-waste { display: flex; gap: 0.3rem; }
    .stock, .waste, .foundation {
        width: 50px; height: 70px;
        background: var(--secondary);
        border: 2px solid var(--card-border);
        border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.2rem;
        flex-shrink: 0;
    }
    .stock { cursor: pointer; }
    .foundations { display: flex; gap: 0.3rem; }
    .tableau { 
        display: flex; 
        gap: 0.2rem; 
        justify-content: center; 
        width: 100%; 
        max-width: 450px;
    }
    .tableau-col {
        position: relative; 
        width: 50px; 
        min-height: 300px;
    }
    .tableau-card {
        position: absolute; 
        width: 50px; 
        height: 70px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
    }
    .tableau-card.face-down { 
        background: var(--accent2); 
    }
    .tableau-card.selected {
        box-shadow: 0 0 0 3px var(--accent);
        transform: translateY(-5px);
    }
    .card { 
        width: 100%; 
        height: 100%; 
        padding: 2px; 
        font-weight: bold; 
        display: flex;
        flex-direction: column;
    }
    .card-top { font-size: 0.6rem; }
    .card-center { 
        font-size: 1.2rem; 
        text-align: center; 
        flex: 1; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
    }
    .sol-controls {
        display: flex; 
        gap: 0.5rem; 
        margin-top: 0.5rem;
    }
    .sol-btn {
        background: var(--tertiary);
        border: 1px solid var(--card-border);
        color: var(--text);
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
    }
    .sol-btn:hover { background: var(--accent); }
`;
document.head.appendChild(solStyle);

window.initGame = initGame;
window.cleanup = cleanup;
window.drawCard = drawCard;
window.selectCard = selectCard;
window.initSolitaire = initSolitaire;
window.autoComplete = autoComplete;
})();
