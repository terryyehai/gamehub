(function() {
/* ============================================
   大老二遊戲 (Big Two / Dou Dizhu)
   ============================================ */

let bigTwoDeck = [];
let playerHand = [];
let computerHand = [];
let centerCards = [];
let centerPlayType = '';
let centerPlayer = '';
let currentPlayer = 'player';
let gameStarted = false;

// 牌值排序：3最小，2最大
const cardValues = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
const suitOrder = ['♣', '♦', '♥', '♠']; // 梅花<方塊<紅心<黑桃

function cleanup() {
    gameStarted = false;
}

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="bigtwo-container">
            <div class="bt-info" id="btInfo">
                <span id="btStatus">等待開始...</span>
            </div>
            <div class="bt-center">
                <div class="bt-cards" id="centerCards"></div>
                <div class="bt-play-info" id="playInfo"></div>
            </div>
            <div class="bt-player" id="playerHand"></div>
            <div class="bt-controls">
                <button class="bt-btn pass" onclick="passPlay()">過</button>
                <button class="bt-btn play" onclick="playCards()">出牌</button>
                <button class="bt-btn new" onclick="initBigTwo()">新遊戲</button>
            </div>
            <div class="bt-cards-left">電腦剩餘: <span id="computerCount">13</span>張</div>
        </div>
    `;
    
    initBigTwo();
}

function initBigTwo() {
    // 創建牌組
    bigTwoDeck = [];
    for (let v = 0; v < 13; v++) {
        for (let s = 0; s < 4; s++) {
            bigTwoDeck.push({ 
                value: v, 
                suit: suitOrder[s], 
                display: cardValues[v] + suitOrder[s] 
            });
        }
    }
    
    // 洗牌
    for (let i = bigTwoDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bigTwoDeck[i], bigTwoDeck[j]] = [bigTwoDeck[j], bigTwoDeck[i]];
    }
    
    // 發牌
    playerHand = bigTwoDeck.slice(0, 13).sort((a, b) => compareCards(a, b));
    computerHand = bigTwoDeck.slice(13, 26).sort((a, b) => compareCards(a, b));
    
    centerCards = [];
    centerPlayType = '';
    centerPlayer = '';
    currentPlayer = 'player';
    gameStarted = true;
    
    // 找到梅花3的玩家先出
    const playerHasClub3 = playerHand.some(c => c.value === 0 && c.suit === '♣');
    currentPlayer = playerHasClub3 ? 'player' : 'computer';
    
    renderBigTwo();
    updateStatus();
    
    // 電腦先出
    if (currentPlayer === 'computer') {
        setTimeout(computerPlay, 1000);
    }
}

function compareCards(a, b) {
    if (a.value !== b.value) return a.value - b.value;
    return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
}

function getCardColor(suit) {
    return (suit === '♥' || suit === '♦') ? '#d00' : '#000';
}

function renderBigTwo() {
    // 玩家手牌
    const playerEl = document.getElementById('playerHand');
    playerEl.innerHTML = playerHand.map((card, i) => `
        <div class="bt-card ${card.selected ? 'selected' : ''}" 
             onclick="selectCard(${i})"
             style="color:${getCardColor(card.suit)}">
            ${card.display}
        </div>
    `).join('');
    
    // 電腦手牌
    const computerEl = document.getElementById('computerHand');
    if (!document.getElementById('computerHand')) {
        // Create if not exists
        const container = document.querySelector('.bt-center');
        const compDiv = document.createElement('div');
        compDiv.className = 'bt-computer';
        compDiv.id = 'computerHand';
        compDiv.style.cssText = 'display:flex;justify-content:center;flex-wrap:wrap;gap:2px;min-height:40px;margin-bottom:5px;';
        container.insertBefore(compDiv, document.getElementById('centerCards'));
    }
    document.getElementById('computerHand').innerHTML = 
        computerHand.map((_, i) => `<div class="bt-card-back">🃏</div>`).join('');
    
    document.getElementById('computerCount').textContent = computerHand.length;
    
    // 中央牌
    const centerEl = document.getElementById('centerCards');
    if (centerCards.length > 0) {
        centerEl.innerHTML = centerCards.map(card => `
            <div class="bt-card" style="color:${getCardColor(card.suit)}">${card.display}</div>
        `).join('');
    } else {
        centerEl.innerHTML = '<div class="bt-placeholder">等待出牌...</div>';
    }
    
    // 顯示提示
    const playInfoEl = document.getElementById('playInfo');
    if (centerPlayType) {
        playInfoEl.textContent = `${centerPlayer === 'player' ? '你' : '電腦'}出了 ${centerPlayType}`;
    } else {
        playInfoEl.textContent = '首家出任意牌型';
    }
}

function selectCard(index) {
    if (currentPlayer !== 'player') return;
    
    playerHand[index].selected = !playerHand[index].selected;
    renderBigTwo();
    sound.click();
}

function getSelectedCards() {
    return playerHand.filter(c => c.selected);
}

function checkPlayType(cards) {
    if (!cards || cards.length === 0) return null;
    
    const len = cards.length;
    
    if (len === 1) return '單張';
    
    if (len === 2) {
        if (cards[0].value === cards[1].value) return '對子';
    }
    
    if (len === 3) {
        if (cards[0].value === cards[1].value && cards[1].value === cards[2].value) {
            return '三條';
        }
    }
    
    if (len === 5) {
        // 檢查順子
        const values = cards.map(c => c.value).sort((a, b) => a - b);
        const isStraight = values.every((v, i) => i === 0 || v === values[i-1] + 1);
        
        // 檢查同花
        const isFlush = cards.every(c => c.suit === cards[0].suit);
        
        if (isStraight && isFlush) return '同花順';
        if (isStraight) return '順子';
        if (isFlush) return '同花';
        
        // 鐵支 + 單張
        const counts = {};
        cards.forEach(c => counts[c.value] = (counts[c.value] || 0) + 1);
        const hasFour = Object.values(counts).includes(4);
        if (hasFour) return '鐵支';
    }
    
    return `${len}張`;
}

function canBeat(cards, lastCards) {
    if (!lastCards || lastCards.length === 0) return true;
    if (cards.length !== lastCards.length) return false;
    
    const type = checkPlayType(cards);
    const lastType = checkPlayType(lastCards);
    
    if (type !== lastType) return false;
    
    // 比較大小
    const maxCard = getMaxCard(cards);
    const lastMaxCard = getMaxCard(lastCards);
    
    return compareCards(maxCard, lastMaxCard) > 0;
}

function getMaxCard(cards) {
    return cards.reduce((max, c) => compareCards(c, max) > 0 ? c : max, cards[0]);
}

function playCards() {
    if (currentPlayer !== 'player') return;
    
    const selected = getSelectedCards();
    if (selected.length === 0) {
        alert('請選擇要出的牌！');
        return;
    }
    
    const type = checkPlayType(selected);
    
    // 首家可以出任意牌
    if (!centerPlayer) {
        executePlay(selected, 'player');
        return;
    }
    
    // 必須能打過上家
    if (centerPlayer === 'computer') {
        if (canBeat(selected, centerCards)) {
            executePlay(selected, 'player');
        } else {
            alert('必須打過上家的牌！');
        }
        return;
    }
    
    // 首家
    executePlay(selected, 'player');
}

function passPlay() {
    if (currentPlayer !== 'player') return;
    if (!centerPlayer) {
        alert('首家不能過！');
        return;
    }
    
    currentPlayer = 'computer';
    updateStatus();
    setTimeout(computerPlay, 1000);
    sound.click();
}

function executePlay(cards, player) {
    // 移除選中的牌
    if (player === 'player') {
        playerHand = playerHand.filter(c => !c.selected);
    } else {
        // 電腦隨機選牌
        computerHand = computerHand.filter(c => !cards.includes(c));
    }
    
    centerCards = cards;
    centerPlayType = checkPlayType(cards);
    centerPlayer = player;
    
    renderBigTwo();
    updateStatus();
    sound.success();
    
    // 檢查獲勝
    if (playerHand.length === 0) {
        setTimeout(() => {
            try { alert('🎉 你獲勝了！'); } catch(e) {}
            sound.win();
        }, 100);
        gameStarted = false;
        return;
    }
    if (computerHand.length === 0) {
        setTimeout(() => {
            try { alert('💀 電腦獲勝！'); } catch(e) {}
            sound.lose();
        }, 100);
        gameStarted = false;
        return;
    }
    
    // 切換玩家
    currentPlayer = player === 'player' ? 'computer' : 'player';
    updateStatus();
    
    if (currentPlayer === 'computer') {
        setTimeout(computerPlay, 1000);
    }
}

function computerPlay() {
    if (!gameStarted) return;
    
    // 簡單 AI
    let playable = [];
    
    // 首家
    if (!centerPlayer) {
        // 找最小的牌
        playable = [computerHand[0]];
    } else if (centerPlayer === 'player') {
        // 找能打過的
        for (let i = 0; i < computerHand.length; i++) {
            if (canBeat([computerHand[i]], centerCards)) {
                playable = [computerHand[i]];
                break;
            }
        }
    } else {
        // 首家
        playable = [computerHand[0]];
    }
    
    if (playable.length > 0) {
        executePlay(playable, 'computer');
    } else if (centerPlayer === 'player') {
        currentPlayer = 'player';
        updateStatus();
    } else {
        setTimeout(computerPlay, 500);
    }
}

function updateStatus() {
    const el = document.getElementById('btStatus');
    if (currentPlayer === 'player') {
        el.textContent = '👤 你的回合';
        el.style.color = '#0f0';
    } else {
        el.textContent = '🤖 電腦思考中...';
        el.style.color = '#f0f';
    }
}

// 樣式
const btStyle = document.createElement('style');
btStyle.textContent = `
    .bigtwo-container { 
        display: flex; 
        flex-direction: column; 
        height: 100%; 
        width: 100%;
        padding: 0.5rem; 
        gap: 0.3rem; 
    }
    .bt-info { text-align: center; padding: 0.3rem; }
    #btStatus { font-size: 1.1rem; font-weight: bold; }
    .bt-center { 
        flex: 1; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        gap: 0.3rem;
        min-height: 80px;
    }
    .bt-cards { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; }
    .bt-play-info { font-size: 0.9rem; color: var(--text-dim); }
    .bt-placeholder { color: var(--text-dim); }
    .bt-card, .bt-card-back {
        width: 38px; height: 52px; border-radius: 4px; display: flex;
        align-items: center; justify-content: center; font-size: 0.75rem;
        cursor: pointer; transition: transform 0.2s; margin: 1px;
        background: #fff; border: 1px solid #ccc; font-weight: bold;
    }
    .bt-card-back { background: var(--accent2); color: #fff; }
    .bt-card.selected { 
        transform: translateY(-15px); 
        background: var(--accent);
        border-color: var(--accent);
    }
    .bt-player { 
        display: flex; 
        justify-content: center; 
        flex-wrap: wrap; 
        gap: 2px;
        min-height: 60px;
    }
    .bt-controls { display: flex; justify-content: center; gap: 0.5rem; }
    .bt-btn {
        padding: 0.5rem 1rem; border: none; border-radius: 6px;
        font-size: 0.9rem; cursor: pointer;
    }
    .bt-btn.pass { background: var(--tertiary); color: var(--text); }
    .bt-btn.play { background: var(--accent); color: var(--primary); }
    .bt-btn.new { background: var(--accent2); color: #fff; }
    .bt-cards-left { text-align: center; font-size: 0.8rem; color: var(--text-dim); }
`;
document.head.appendChild(btStyle);

window.initGame = initGame;
window.cleanup = cleanup;
window.selectCard = selectCard;
window.playCards = playCards;
window.passPlay = passPlay;
window.initBigTwo = initBigTwo;
})();
