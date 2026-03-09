/* ============================================
   軍棋遊戲 (Military Chess / 陸軍棋)
   ============================================ */
// 2人對戰版軍棋 - 簡化規則

let militaryBoard = [];
let militaryRevealed = [];
let militaryFlipped = [];
let militarySelected = null;
let militaryCurrentPlayer = 'red';
let canvasMil, ctxMil;
let cellSizeMil, boardPaddingMil = 25;
let pieceRadiusMil;

// 軍棋棋子等級 (red: 紅方, blue: 黑方)
const militaryPieces = {
    // 紅方 (大本營)
    red: [
        { name: '司令', rank: 11 },
        { name: '軍長', rank: 10 },
        { name: '師長', rank: 9 },
        { name: '旅長', rank: 8 },
        { name: '團長', rank: 7 },
        { name: '營長', rank: 6 },
        { name: '連長', rank: 5 },
        { name: '排長', rank: 4 },
        { name: '工兵', rank: 3 },
        { name: '地雷', rank: 2 },
        { name: '地雷', rank: 2 },
        { name: '地雷', rank: 2 },
        { name: '炸彈', rank: 1 },
        { name: '炸彈', rank: 1 },
        { name: '軍旗', rank: 0 }
    ],
    // 黑方
    blue: [
        { name: '司令', rank: 11 },
        { name: '軍長', rank: 10 },
        { name: '師長', rank: 9 },
        { name: '旅長', rank: 8 },
        { name: '團長', rank: 7 },
        { name: '營長', rank: 6 },
        { name: '連長', rank: 5 },
        { name: '排長', rank: 4 },
        { name: '工兵', rank: 3 },
        { name: '地雷', rank: 2 },
        { name: '地雷', rank: 2 },
        { name: '地雷', rank: 2 },
        { name: '炸彈', rank: 1 },
        { name: '炸彈', rank: 1 },
        { name: '軍旗', rank: 0 }
    ]
};

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="military-container">
            <div class="military-info">
                <div class="military-turn" id="militaryTurn">紅方回合</div>
                <button class="military-btn" onclick="resetMilitary()">🔄 重置</button>
            </div>
            <canvas id="militaryCanvas"></canvas>
            <div class="military-legend">
                <div class="legend-title">棋子大小</div>
                <div class="legend-items">
                    <span>🫡 司令 > 軍長 > ... > 工兵</span>
                    <span>💣 地雷只能被工兵挖</span>
                    <span>💥 炸彈同歸於盡</span>
                    <span>🚩 軍旗被吃即失敗</span>
                </div>
            </div>
        </div>
    `;
    
    canvasMil = document.getElementById('militaryCanvas');
    ctxMil = canvasMil.getContext('2d');
    
    resizeMilitaryCanvas();
    window.addEventListener('resize', resizeMilitaryCanvas);
    
    initMilitary();
    drawMilitary();
    
    canvasMil.addEventListener('click', handleMilitaryClick);
    canvasMil.addEventListener('touchstart', handleMilitaryTouch, { passive: false });
}

function resizeMilitaryCanvas() {
    const container = canvasMil.parentElement;
    const size = Math.min(container.clientWidth - 20, 420);
    canvasMil.width = size;
    canvasMil.height = size * 1.3;
    cellSizeMil = (size - boardPaddingMil * 2) / 6;
    pieceRadiusMil = cellSizeMil * 0.4;
    drawMilitary();
}

function initMilitary() {
    militaryBoard = [];
    militaryRevealed = [];
    militaryFlipped = [];
    militarySelected = null;
    militaryCurrentPlayer = 'red';
    
    // 初始化 6x6 棋盤 (2人對戰)
    for (let row = 0; row < 6; row++) {
        militaryBoard[row] = [];
        militaryRevealed[row] = [];
        militaryFlipped[row] = [];
        for (let col = 0; col < 6; col++) {
            militaryBoard[row][col] = null;
            militaryRevealed[row][col] = false;
            militaryFlipped[row][col] = false;
        }
    }
    
    // 擺放紅方棋子 (上半部)
    const redPieces = [...militaryPieces.red];
    shuffleArray(redPieces);
    let idx = 0;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 6; col++) {
            if (idx < redPieces.length) {
                militaryBoard[row][col] = { ...redPieces[idx], side: 'red' };
                militaryFlipped[row][col] = false;
                idx++;
            }
        }
    }
    
    // 擺放藍方棋子 (下半部)
    const bluePieces = [...militaryPieces.blue];
    shuffleArray(bluePieces);
    idx = 0;
    for (let row = 3; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            if (idx < bluePieces.length) {
                militaryBoard[row][col] = { ...bluePieces[idx], side: 'blue' };
                militaryFlipped[row][col] = false;
                idx++;
            }
        }
    }
    
    updateMilitaryUI();
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function drawMilitary() {
    if (!ctxMil) return;
    
    const w = canvasMil.width;
    const h = canvasMil.height;
    
    // 背景
    ctxMil.fillStyle = '#1a1a2e';
    ctxMil.fillRect(0, 0, w, h);
    
    // 棋盤
    ctxMil.fillStyle = '#2d5a27';
    ctxMil.fillRect(boardPaddingMil, boardPaddingMil, cellSizeMil * 6, cellSizeMil * 6);
    ctxMil.strokeStyle = '#1e3d1a';
    ctxMil.lineWidth = 2;
    ctxMil.strokeRect(boardPaddingMil, boardPaddingMil, cellSizeMil * 6, cellSizeMil * 6);
    
    // 網格
    for (let i = 1; i < 6; i++) {
        ctxMil.beginPath();
        ctxMil.moveTo(boardPaddingMil + i * cellSizeMil, boardPaddingMil);
        ctxMil.lineTo(boardPaddingMil + i * cellSizeMil, boardPaddingMil + cellSizeMil * 6);
        ctxMil.stroke();
        
        ctxMil.beginPath();
        ctxMil.moveTo(boardPaddingMil, boardPaddingMil + i * cellSizeMil);
        ctxMil.lineTo(boardPaddingMil + cellSizeMil * 6, boardPaddingMil + i * cellSizeMil);
        ctxMil.stroke();
    }
    
    // 鐵路線 (中間兩行)
    ctxMil.strokeStyle = '#666';
    ctxMil.lineWidth = 3;
    ctxMil.setLineDash([10, 10]);
    ctxMil.beginPath();
    ctxMil.moveTo(boardPaddingMil, boardPaddingMil + cellSizeMil * 2.5);
    ctxMil.lineTo(boardPaddingMil + cellSizeMil * 6, boardPaddingMil + cellSizeMil * 2.5);
    ctxMil.moveTo(boardPaddingMil, boardPaddingMil + cellSizeMil * 3.5);
    ctxMil.lineTo(boardPaddingMil + cellSizeMil * 6, boardPaddingMil + cellSizeMil * 3.5);
    ctxMil.stroke();
    ctxMil.setLineDash([]);
    
    // 大本營標記
    ctxMil.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctxMil.fillRect(boardPaddingMil, boardPaddingMil, cellSizeMil, cellSizeMil);
    ctxMil.fillRect(boardPaddingMil + cellSizeMil * 5, boardPaddingMil, cellSizeMil, cellSizeMil);
    
    ctxMil.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctxMil.fillRect(boardPaddingMil, boardPaddingMil + cellSizeMil * 5, cellSizeMil, cellSizeMil);
    ctxMil.fillRect(boardPaddingMil + cellSizeMil * 5, boardPaddingMil + cellSizeMil * 5, cellSizeMil, cellSizeMil);
    
    // 繪製棋子
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            if (militaryBoard[row][col]) {
                if (militaryFlipped[row][col]) {
                    drawMilitaryPiece(col, row, militaryBoard[row][col]);
                } else {
                    drawMilitaryBack(col, row, militaryBoard[row][col].side);
                }
            }
        }
    }
    
    // 選中標記
    if (militarySelected) {
        const { col, row } = militarySelected;
        ctxMil.strokeStyle = '#00ff00';
        ctxMil.lineWidth = 3;
        ctxMil.strokeRect(
            boardPaddingMil + col * cellSizeMil - pieceRadiusMil,
            boardPaddingMil + row * cellSizeMil - pieceRadiusMil,
            pieceRadiusMil * 2, pieceRadiusMil * 2
        );
        
        // 顯示可吃位置
        if (militaryFlipped[row][col]) {
            const moves = getMilitaryMoves(col, row);
            moves.forEach(m => {
                ctxMil.fillStyle = 'rgba(255, 0, 0, 0.4)';
                ctxMil.beginPath();
                ctxMil.arc(
                    boardPaddingMil + m.col * cellSizeMil,
                    boardPaddingMil + m.row * cellSizeMil,
                    pieceRadiusMil * 0.5, 0, Math.PI * 2
                );
                ctxMil.fill();
            });
        }
    }
}

function drawMilitaryPiece(col, row, piece) {
    const x = boardPaddingMil + col * cellSizeMil;
    const y = boardPaddingMil + row * cellSizeMil;
    const isRed = piece.side === 'red';
    
    // 棋子背景
    const gradient = ctxMil.createRadialGradient(x - 3, y - 3, 0, x, y, pieceRadiusMil);
    gradient.addColorStop(0, isRed ? '#ff6b6b' : '#4a90d9');
    gradient.addColorStop(1, isRed ? '#c0392b' : '#1e3d5c');
    
    ctxMil.fillStyle = gradient;
    ctxMil.beginPath();
    ctxMil.arc(x, y, pieceRadiusMil, 0, Math.PI * 2);
    ctxMil.fill();
    
    // 棋子邊框
    ctxMil.strokeStyle = isRed ? '#ffaa00' : '#00aaff';
    ctxMil.lineWidth = 2;
    ctxMil.stroke();
    
    // 文字
    ctxMil.fillStyle = '#fff';
    ctxMil.font = `bold ${pieceRadiusMil * 0.8}px "Noto Sans TC", Arial`;
    ctxMil.textAlign = 'center';
    ctxMil.textBaseline = 'middle';
    ctxMil.fillText(piece.name, x, y);
}

function drawMilitaryBack(col, row, side) {
    const x = boardPaddingMil + col * cellSizeMil;
    const y = boardPaddingMil + row * cellSizeMil;
    const isRed = side === 'red';
    
    ctxMil.fillStyle = isRed ? '#8B0000' : '#00008B';
    ctxMil.beginPath();
    ctxMil.arc(x, y, pieceRadiusMil, 0, Math.PI * 2);
    ctxMil.fill();
    
    ctxMil.fillStyle = '#fff';
    ctxMil.font = `bold ${pieceRadiusMil}px Arial`;
    ctxMil.textAlign = 'center';
    ctxMil.textBaseline = 'middle';
    ctxMil.fillText('?', x, y);
}

function handleMilitaryClick(e) {
    const rect = canvasMil.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor((x - boardPaddingMil) / cellSizeMil);
    const row = Math.floor((y - boardPaddingMil) / cellSizeMil);
    
    if (col < 0 || col > 5 || row < 0 || row > 5) return;
    
    militarySelect(col, row);
}

function handleMilitaryTouch(e) {
    e.preventDefault();
    handleMilitaryClick(e.touches[0]);
}

function militarySelect(col, row) {
    const piece = militaryBoard[row][col];
    if (!piece) return;
    
    // 翻牌 (第一次)
    if (!militaryFlipped[row][col]) {
        militaryFlipped[row][col] = true;
        
        // 檢查是否軍旗
        if (piece.name === '軍旗') {
            alert(piece.side === 'red' ? '⚫ 藍方獲勝！' : '🔴 紅方獲勝！');
            resetMilitary();
            return;
        }
        
        checkMilitaryWin();
        sound.flip();
        drawMilitary();
        return;
    }
    
    // 選擇己方棋子
    const isCurrentRed = militaryCurrentPlayer === 'red';
    const isPieceRed = piece.side === 'red';
    
    if ((isPieceRed && isCurrentRed) || (!isPieceRed && !isCurrentRed)) {
        militarySelected = { col, row };
        sound.click();
        drawMilitary();
        return;
    }
    
    // 吃子
    if (militarySelected) {
        const moves = getMilitaryMoves(militarySelected.col, militarySelected.row);
        const canEat = moves.some(m => m.col === col && m.row === row);
        
        if (canEat) {
            executeMilitaryCapture(militarySelected.col, militarySelected.row, col, row);
        } else {
            militarySelected = null;
        }
        
        drawMilitary();
    }
}

function getMilitaryMoves(fromCol, fromRow) {
    const piece = militaryBoard[fromRow][fromCol];
    if (!piece || !militaryFlipped[fromRow][fromCol]) return [];
    
    const moves = [];
    const directions = [[0,1], [0,-1], [1,0], [-1,0]];
    
    // 地雷只能被工兵吃
    if (piece.name === '地雷') return moves;
    
    // 炸彈只能炸別人，不能動
    if (piece.name === '炸彈') return moves;
    
    // 軍旗不能動
    if (piece.name === '軍旗') return moves;
    
    for (const [dx, dy] of directions) {
        const toCol = fromCol + dx;
        const toRow = fromRow + dy;
        
        if (toCol < 0 || toCol > 5 || toRow < 0 || toRow > 5) continue;
        
        const target = militaryBoard[toRow][toCol];
        
        if (!target) {
            // 空位可移動
            moves.push({ col: toCol, row: toRow });
        } else if (militaryFlipped[toRow][toCol]) {
            // 已翻開的棋子可吃
            const isTargetRed = target.side === 'red';
            const isCurrentRed = piece.side === 'red';
            
            if (isTargetRed !== isCurrentRed) {
                if (canMilitaryCapture(piece, target)) {
                    moves.push({ col: toCol, row: toRow });
                }
            }
        }
    }
    
    return moves;
}

function canMilitaryCapture(attacker, defender) {
    // 炸彈同歸於盡
    if (attacker.name === '炸彈' || defender.name === '炸彈') return true;
    
    // 工兵挖地雷
    if (attacker.name === '工兵' && defender.name === '地雷') return true;
    if (attacker.name === '地雷' && defender.name === '工兵') return true;
    
    // 軍旗
    if (defender.name === '軍旗') return true;
    
    // 大吃小
    return attacker.rank > defender.rank;
}

function executeMilitaryCapture(fromCol, fromRow, toCol, toRow) {
    const attacker = militaryBoard[fromRow][fromCol];
    const defender = militaryBoard[toRow][toCol];
    
    const result = resolveMilitaryCombat(attacker, defender);
    
    if (result === 'attacker') {
        // 攻擊者獲勝
        militaryBoard[toRow][toCol] = militaryBoard[fromRow][fromCol];
        militaryBoard[fromRow][fromCol] = null;
        militaryFlipped[toRow][toCol] = true;
        
        militaryCurrentPlayer = militaryCurrentPlayer === 'red' ? 'blue' : 'red';
        sound.capture();
    } else if (result === 'defender') {
        // 防守者獲勝
        militaryBoard[fromRow][fromCol] = null;
        militaryCurrentPlayer = militaryCurrentPlayer === 'red' ? 'blue' : 'red';
        sound.fail();
    } else {
        // 同歸於盡
        militaryBoard[fromRow][fromCol] = null;
        militaryBoard[toRow][toCol] = null;
        militaryCurrentPlayer = militaryCurrentPlayer === 'red' ? 'blue' : 'red';
        sound.lose();
    }
    
    militarySelected = null;
    militaryFlipped[toRow][toCol] = true;
    updateMilitaryUI();
    checkMilitaryWin();
}

function resolveMilitaryCombat(attacker, defender) {
    // 炸彈同歸於盡
    if (attacker.name === '炸彈' || defender.name === '炸彈') return 'draw';
    
    // 工兵挖地雷
    if (attacker.name === '工兵' && defender.name === '地雷') return 'attacker';
    if (attacker.name === '地雷' && defender.name === '工兵') return 'attacker';
    
    // 軍旗
    if (defender.name === '軍旗') return 'attacker';
    if (attacker.name === '軍旗') return 'defender';
    
    // 大吃小
    if (attacker.rank > defender.rank) return 'attacker';
    if (attacker.rank < defender.rank) return 'defender';
    
    // 同級
    return 'draw';
}

function checkMilitaryWin() {
    let redFlag = false, blueFlag = false;
    let redPieces = 0, bluePieces = 0;
    
    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
            const p = militaryBoard[r][c];
            if (p) {
                if (p.side === 'red') {
                    redPieces++;
                    if (p.name === '軍旗') redFlag = true;
                } else {
                    bluePieces++;
                    if (p.name === '軍旗') blueFlag = true;
                }
            }
        }
    }
    
    if (!redFlag) {
        alert('⚫ 藍方獲勝！');
        resetMilitary();
    } else if (!blueFlag) {
        alert('🔴 紅方獲勝！');
        resetMilitary();
    }
}

function updateMilitaryUI() {
    const el = document.getElementById('militaryTurn');
    el.textContent = militaryCurrentPlayer === 'red' ? '🔴 紅方回合' : '🔵 藍方回合';
    el.style.color = militaryCurrentPlayer === 'red' ? '#ff4444' : '#4a90d9';
}

function resetMilitary() {
    initMilitary();
    drawMilitary();
    sound.button();
}

// 樣式
const milStyle = document.createElement('style');
milStyle.textContent = `
    .military-container { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; }
    .military-info { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 380px; }
    .military-turn { font-size: 1.3rem; font-weight: bold; }
    .military-btn { background: var(--tertiary); border: 1px solid var(--card-border); color: var(--text); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
    .military-btn:hover { background: var(--accent); border-color: var(--accent); }
    #militaryCanvas { border-radius: 8px; box-shadow: var(--glow); }
    .military-legend { color: var(--text-dim); font-size: 0.8rem; text-align: center; }
    .legend-title { font-weight: bold; margin-bottom: 0.3rem; }
    .legend-items { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
`;
document.head.appendChild(milStyle);
