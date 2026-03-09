/* ============================================
   大老二遊戲 (Big Two / Dou Dizhu)
   ============================================ */
let bigTwoDeck = [];
let playerHand = [];
let computerHand = [];
let centerCards = [];
let currentPlayer = 'player'; // player, computer
let lastPlayer = null;
let lastPlayType = null;
let lastPlayCards = [];
let canvasBT, ctxBT;

// 牌型定義
const cardValues = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
const suits = ['♣', '♦', '♥', '♠']; // 梅花, 方塊, 紅心, 黑桃

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="bigtwo-container">
            <div class="bt-computer" id="computerHand"></div>
            <div class="bt-center">
                <div class="bt-info">
                    <div class="bt-turn" id="turnIndicator">玩家回合</div>
                    <div class="bt-last" id="lastPlay"></div>
                </div>
                <div class="bt-cards" id="centerCards"></div>
            </div>
            <div class="bt-player" id="playerHand"></div>
            <div class="bt-controls">
                <button class="bt-btn pass" onclick="passPlay()">過</button>
                <button class="bt-btn play" onclick="playCards()">出牌</button>
                <button class="bt-btn new" onclick="initBigTwo()">新遊戲</button>
            </div>
        </div>
    `;
    
    initBigTwo();
}

function initBigTwo() {
    // 創建牌組
    bigTwoDeck = [];
    for (const suit of suits) {
        for (let i = 0; i < 13; i++) {
            bigTwoDeck.push({ suit, value: i, display: cardValues[i] });
        }
    }
    
    // 洗牌
    for (let i = bigTwoDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bigTwoDeck[i], bigTwoDeck[j]] = [bigTwoDeck[j], bigTwoDeck[i]];
    }
    
    // 發牌
    playerHand = bigTwoDeck.slice(0, 13).sort((a, b) => a.value - b.value || suits.indexOf(a.suit) - suits.indexOf(b.suit));
    computerHand = bigTwoDeck.slice(13, 26).sort((a, b) => a.value - b.value || suits.indexOf(a.suit) - suits.indexOf(b.suit));
    centerCards = [];
    lastPlayer = null;
    lastPlayType = null;
    lastPlayCards = [];
    
    // 找到持有梅花3的玩家先出
    const playerHasClub3 = playerHand.some(c => c.suit === '♣' && c.value === 0);
    currentPlayer = playerHasClub3 ? 'player' : 'computer';
    
    renderBigTwo();
    updateTurnIndicator();
    sound.button();
    
    // 電腦先出
    if (currentPlayer === 'computer') {
        setTimeout(computerPlay, 1000);
    }
}

function renderBigTwo() {
    // 電腦手牌 (只顯示背面)
    const computerEl = document.getElementById('computerHand');
    computerEl.innerHTML = computerHand.map((_, i) => 
        `<div class="bt-card-back">🃏</div>`
    ).join('');
    
    // 玩家手牌
    const playerEl = document.getElementBy');
    playerElId('playerHand.innerHTML = playerHand.map((card, i) => 
        `<div class="bt-card ${card.selected ? 'selected' : ''}" onclick="selectCard(${i})">
            <span class="${getSuitColor(card.suit)}">${card.display}${card.suit}</span>
        </div>`
    ).join('');
    
    // 中央牌
    const centerEl = document.getElementById('centerCards');
    if (centerCards.length > 0) {
        centerEl.innerHTML = centerCards.map(card => 
            `<div class="bt-card"><span class="${getSuitColor(card.suit)}">${card.display}${card.suit}</span></div>`
        ).join('');
    } else {
        centerEl.innerHTML = '<div class="bt-placeholder">等待出牌...</div>';
    }
    
    // 最後出牌
    const lastPlayEl = document.getElementById('lastPlay');
    if (lastPlayType) {
        lastPlayEl.textContent = `${lastPlayer === 'player' ? '玩家' : '電腦'}出了: ${lastPlayType}`;
    } else {
        lastPlayEl.textContent = '等待首出';
    }
}

function getSuitColor(suit) {
    return (suit === '♥' || suit === '♦') ? 'red' : 'black';
}

function selectCard(index) {
    if (currentPlayer !== 'player') return;
    
    playerHand[index].selected = !playerHand[index].selected;
    renderBigTwo();
    sound.click();
}

function playCards() {
    if (currentPlayer !== 'player') return;
    
    const selected = playerHand.filter(c => c.selected);
    if (selected.length === 0) return;
    
    const playType = checkPlayType(selected);
    
    if (!lastPlayer || lastPlayer === 'computer') {
        // 自由出牌
        executePlay(selected, 'player');
    } else {
        // 必須比上次大
        if (canBeat(selected, lastPlayCards)) {
            executePlay(selected, 'player');
        } else {
            alert('出牌必須大於上家！');
        }
    }
}

function passPlay() {
    if (currentPlayer !== 'player') return;
    if (!lastPlayer || lastPlayer === 'computer') {
        alert('首家不能過！');
        return;
    }
    
    currentPlayer = 'computer';
    updateTurnIndicator();
    setTimeout(computerPlay, 1000);
    sound.click();
}

function executePlay(cards, player) {
    // 移除選中的牌
    if (player === 'player') {
        playerHand = playerHand.filter(c => !c.selected);
    } else {
        computerHand = computerHand.filter(c => !cards.includes(c));
    }
    
    centerCards = cards;
    lastPlayer = player;
    lastPlayType = checkPlayType(cards);
    lastPlayCards = cards;
    
    renderBigTwo();
    updateTurnIndicator();
    sound.success();
    
    // 檢查獲勝
    if (playerHand.length === 0) {
        alert('🎉 你獲勝了！');
        return;
    }
    if (computerHand.length === 0) {
        alert('💀 電腦獲勝！');
        return;
    }
    
    // 切換玩家
    currentPlayer = player === 'player' ? 'computer' : 'player';
    updateTurnIndicator();
    
    if (currentPlayer === 'computer') {
        setTimeout(computerPlay, 1000);
    }
}

function computerPlay() {
    // 簡單AI
    let playable = [];
    
    if (!lastPlayer || lastPlayer === 'player') {
        // 自由出
        playable = computerHand.slice(0, Math.min(5, computerHand.length));
    } else {
        // 找能打過的
        for (let i = 0; i < computerHand.length; i++) {
            if (canBeat([computerHand[i]], lastPlayCards)) {
                playable = [computerHand[i]];
                break;
            }
        }
    }
    
    if (playable.length > 0) {
        executePlay(playable, 'computer');
    } else if (lastPlayer === 'player') {
        currentPlayer = 'player';
        updateTurnIndicator();
    } else {
        setTimeout(computerPlay, 500);
    }
}

function checkPlayType(cards) {
    if (cards.length === 1) return '單張';
    if (cards.length === 2 && cards[0].value === cards[1].value) return '對子';
    if (cards.length === 3 && cards[0].value === cards[1].value && cards[1].value === cards[2].value) return '三條';
    if (cards.length === 5) return '五張牌';
    return `${cards.length}張`;
}

function canBeat(cards, lastCards) {
    if (!lastCards) return true;
    if (cards.length !== lastCards.length) return false;
    
    const cardValue = cards[0].value;
    const lastValue = lastCards[0].value;
    
    return cardValue > lastValue;
}

function updateTurnIndicator() {
    const el = document.getElementById('turnIndicator');
    el.textContent = currentPlayer === 'player' ? '👤 你的回合' : '🤖 電腦思考中...';
}

// 樣式
const btStyle = document.createElement('style');
btStyle.textContent = `
    .bigtwo-container { display: flex; flex-direction: column; height: 100%; padding: 1rem; gap: 1rem; }
    .bt-computer { display: flex; justify-content: center; flex-wrap: wrap; gap: 2px; min-height: 60px; }
    .bt-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .bt-info { text-align: center; }
    .bt-turn { font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem; }
    .bt-last { font-size: 0.9rem; color: var(--text-dim); }
    .bt-cards { display: flex; flex-wrap: wrap; justify-content: center; gap: 3px; min-height: 80px; }
    .bt-placeholder { color: var(--text-dim); font-size: 1rem; }
    .bt-card, .bt-card-back {
        width: 45px; height: 65px; border-radius: 4px; display: flex;
        align-items: center; justify-content: center; font-size: 0.9rem;
        cursor: pointer; transition: transform 0.2s;
    }
    .bt-card-back { background: var(--accent2); }
    .bt-card { background: #fff; color: #000; border: 1px solid #ccc; }
    .bt-card.selected { transform: translateY(-15px); background: var(--accent); }
    .bt-card .red { color: #d00; }
    .bt-card .black { color: #000; }
    .bt-player { display: flex; justify-content: center; flex-wrap: wrap; gap: 3px; min-height: 80px; }
    .bt-controls { display: flex; justify-content: center; gap: 1rem; }
    .bt-btn {
        padding: 0.6rem 1.5rem; border: none; border-radius: 6px;
        font-size: 1rem; cursor: pointer; transition: transform 0.2s;
    }
    .bt-btn.pass { background: var(--tertiary); color: var(--text); }
    .bt-btn.play { background: var(--accent); color: var(--primary); }
    .bt-btn.new { background: var(--accent2); color: #fff; }
    .bt-btn:hover { transform: scale(1.05); }
`;
document.head.appendChild(btStyle);
