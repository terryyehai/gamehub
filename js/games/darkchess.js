/* ============================================
   暗棋遊戲 (Dark Chess / 軍棋翻棋)
   ============================================ */
let darkChessBoard = [];
let darkChessRevealed = [];
let darkChessFlipped = [];
let darkChessSelected = null;
let darkChessCurrentPlayer = 'red';
let canvasDC, ctxDC;
let cellSizeDC, boardPaddingDC = 30;
let pieceRadiusDC;

const darkChessPieces = {
    // 紅方
    red: { 帥: 12, 仕: 11, 相: 10, 俥: 9, 傌: 8, 砲: 7, 兵: 6 },
    // 黑方
    black: { 將: 5, 士: 4, 象: 3, 車: 2, 馬: 1, 炮: 0, 卒: -1 }
};

const darkChessInit = [
    ['車', '馬', '象', '士', '將', '士', '象', '馬', '車'],
    ['', '', '炮', '', '', '', '炮', '', ''],
    ['兵', '', '兵', '', '兵', '', '兵', '', '兵'],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['兵', '', '兵', '', '兵', '', '兵', '', '兵'],
    ['', '', '炮', '', '', '', '炮', '', ''],
    ['車', '馬', '象', '士', '將', '士', '象', '馬', '車']
];

const pieceRank = {
    '帥': 12, '將': 11, // 司令
    '仕': 10, '士': 9,   // 軍師
    '相': 8, '象': 7,    // 指揮官
    '俥': 6, '車': 5,    // 戰車
    '傌': 4, '馬': 3,    // 騎兵
    '砲': 2, '炮': 1,    // 砲兵
    '兵': 0, '卒': -1    // 士兵
};

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="darkchess-container">
            <div class="darkchess-info">
                <div class="darkchess-turn" id="darkChessTurn">紅方回合</div>
                <button class="darkchess-btn" onclick="resetDarkChess()">🔄 重置</button>
            </div>
            <canvas id="darkChessCanvas"></canvas>
            <div class="darkchess-rules">
                <p>👆 點擊翻牌 | 吃子規則：大吃小，同級互換</p>
            </div>
        </div>
    `;
    
    canvasDC = document.getElementById('darkChessCanvas');
    ctxDC = canvasDC.getContext('2d');
    
    resizeDarkChessCanvas();
    window.addEventListener('resize', resizeDarkChessCanvas);
    
    initDarkChess();
    drawDarkChess();
    
    canvasDC.addEventListener('click', handleDarkChessClick);
    canvasDC.addEventListener('touchstart', handleDarkChessTouch, { passive: false });
}

function resizeDarkChessCanvas() {
    const container = canvasDC.parentElement;
    const size = Math.min(container.clientWidth - 20, 450);
    canvasDC.width = size;
    canvasDC.height = size * 1.1;
    cellSizeDC = (size - boardPaddingDC * 2) / 8;
    pieceRadiusDC = cellSizeDC * 0.4;
    drawDarkChess();
}

function initDarkChess() {
    darkChessBoard = [];
    darkChessRevealed = [];
    darkChessFlipped = [];
    darkChessSelected = null;
    darkChessCurrentPlayer = 'red';
    
    // 初始化棋盤
    const allPieces = [];
    darkChessInit.forEach(row => {
        row.forEach(piece => {
            if (piece) allPieces.push(piece);
        });
    });
    
    // 洗牌
    for (let i = allPieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allPieces[i], allPieces[j]] = [allPieces[j], allPieces[i]];
    }
    
    // 放置棋子
    let idx = 0;
    for (let row = 0; row < 9; row++) {
        darkChessBoard[row] = [];
        darkChessRevealed[row] = [];
        darkChessFlipped[row] = [];
        for (let col = 0; col < 9; col++) {
            darkChessBoard[row][col] = allPieces[idx++] || '';
            darkChessRevealed[row][col] = false;
            darkChessFlipped[row][col] = false;
        }
    }
    
    // 紅方先手
    darkChessCurrentPlayer = 'red';
    updateDarkChessUI();
}

function drawDarkChess() {
    if (!ctxDC) return;
    
    const w = canvasDC.width;
    const h = canvasDC.height;
    
    // 背景
    ctxDC.fillStyle = '#1a1a2e';
    ctxDC.fillRect(0, 0, w, h);
    
    // 棋盤
    ctxDC.fillStyle = '#8B4513';
    ctxDC.fillRect(boardPaddingDC, boardPaddingDC, cellSizeDC * 8, cellSizeDC * 9);
    ctxDC.strokeStyle = '#654321';
    ctxDC.lineWidth = 2;
    ctxDC.strokeRect(boardPaddingDC, boardPaddingDC, cellSizeDC * 8, cellSizeDC * 9);
    
    // 網格
    for (let i = 1; i < 9; i++) {
        ctxDC.beginPath();
        ctxDC.moveTo(boardPaddingDC + i * cellSizeDC, boardPaddingDC);
        ctxDC.lineTo(boardPaddingDC + i * cellSizeDC, boardPaddingDC + cellSizeDC * 9);
        ctxDC.stroke();
        
        if (i < 9) {
            ctxDC.beginPath();
            ctxDC.moveTo(boardPaddingDC, boardPaddingDC + i * cellSizeDC);
            ctxDC.lineTo(boardPaddingDC + cellSizeDC * 8, boardPaddingDC + i * cellSizeDC);
            ctxDC.stroke();
        }
    }
    
    // 楚河漢界
    ctxDC.fillStyle = '#1a1a2e';
    ctxDC.fillRect(boardPaddingDC, boardPaddingDC + cellSizeDC * 4, cellSizeDC * 8, cellSizeDC);
    ctxDC.fillStyle = '#fff';
    ctxDC.font = `${cellSizeDC * 0.3}px Arial`;
    ctxDC.textAlign = 'center';
    ctxDC.fillText('楚      河      漢      界', w/2, boardPaddingDC + cellSizeDC * 4.65);
    
    // 繪製棋子
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (darkChessBoard[row][col]) {
                if (darkChessFlipped[row][col]) {
                    drawDarkChessPiece(col, row, darkChessBoard[row][col]);
                } else {
                    drawDarkChessBack(col, row);
                }
            }
        }
    }
    
    // 選中標記
    if (darkChessSelected) {
        const { col, row } = darkChessSelected;
        ctxDC.strokeStyle = '#00ff00';
        ctxDC.lineWidth = 3;
        ctxDC.strokeRect(
            boardPaddingDC + col * cellSizeDC - pieceRadiusDC,
            boardPaddingDC + row * cellSizeDC - pieceRadiusDC,
            pieceRadiusDC * 2, pieceRadiusDC * 2
        );
        
        // 顯示可吃位置
        if (darkChessFlipped[row][col]) {
            const moves = getDarkChessMoves(col, row);
            moves.forEach(m => {
                ctxDC.fillStyle = 'rgba(255, 0, 0, 0.4)';
                ctxDC.beginPath();
                ctxDC.arc(
                    boardPaddingDC + m.col * cellSizeDC,
                    boardPaddingDC + m.row * cellSizeDC,
                    pieceRadiusDC * 0.5, 0, Math.PI * 2
                );
                ctxDC.fill();
            });
        }
    }
}

function drawDarkChessPiece(col, row, piece) {
    const x = boardPaddingDC + col * cellSizeDC;
    const y = boardPaddingDC + row * cellSizeDC;
    const isRed = '帥仕相俥傌兵'.includes(piece);
    
    // 棋子圓
    const gradient = ctxDC.createRadialGradient(x - 5, y - 5, 0, x, y, pieceRadiusDC);
    gradient.addColorStop(0, isRed ? '#ff6b6b' : '#4a4a4a');
    gradient.addColorStop(1, isRed ? '#c0392b' : '#1a1a1a');
    
    ctxDC.fillStyle = gradient;
    ctxDC.beginPath();
    ctxDC.arc(x, y, pieceRadiusDC, 0, Math.PI * 2);
    ctxDC.fill();
    
    // 文字
    ctxDC.fillStyle = '#fff';
    ctxDC.font = `bold ${pieceRadiusDC * 1.2}px "Noto Sans TC", Arial`;
    ctxDC.textAlign = 'center';
    ctxDC.textBaseline = 'middle';
    ctxDC.fillText(piece, x, y);
    
    // 等級數字
    const rank = pieceRank[piece];
    ctxDC.fillStyle = isRed ? '#ffff00' : '#00ff00';
    ctxDC.font = `bold ${pieceRadiusDC * 0.6}px Arial`;
    ctxDC.fillText(rank, x + pieceRadiusDC * 0.7, y - pieceRadiusDC * 0.7);
}

function drawDarkChessBack(col, row) {
    const x = boardPaddingDC + col * cellSizeDC;
    const y = boardPaddingDC + row * cellSizeDC;
    
    // 背面
    const gradient = ctxDC.createLinearGradient(x - pieceRadiusDC, y - pieceRadiusDC, x + pieceRadiusDC, y + pieceRadiusDC);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#2a2a4e');
    gradient.addColorStop(1, '#1a1a2e');
    
    ctxDC.fillStyle = gradient;
    ctxDC.beginPath();
    ctxDC.arc(x, y, pieceRadiusDC, 0, Math.PI * 2);
    ctxDC.fill();
    
    // 問號
    ctxDC.fillStyle = '#00d4ff';
    ctxDC.font = `bold ${pieceRadiusDC}px Arial`;
    ctxDC.textAlign = 'center';
    ctxDC.textBaseline = 'middle';
    ctxDC.fillText('?', x, y);
}

function handleDarkChessClick(e) {
    const rect = canvasDC.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.round((x - boardPaddingDC) / cellSizeDC);
    const row = Math.round((y - boardPaddingDC) / cellSizeDC);
    
    if (col < 0 || col > 8 || row < 0 || row > 8) return;
    
    darkChessSelect(col, row);
}

function handleDarkChessTouch(e) {
    e.preventDefault();
    handleDarkChessClick(e.touches[0]);
}

function darkChessSelect(col, row) {
    const piece = darkChessBoard[row][col];
    if (!piece) return;
    
    // 翻牌
    if (!darkChessFlipped[row][col]) {
        darkChessFlipped[row][col] = true;
        
        // 檢查是否獲勝
        checkDarkChessWin();
        
        sound.flip();
        drawDarkChess();
        return;
    }
    
    // 選擇自己的棋子
    const isRed = '帥仕相俥傌兵'.includes(piece);
    const isCurrentRed = darkChessCurrentPlayer === 'red';
    
    if ((isRed && isCurrentRed) || (!isRed && !isCurrentRed)) {
        darkChessSelected = { col, row };
        sound.click();
        drawDarkChess();
        return;
    }
    
    // 吃子
    if (darkChessSelected) {
        const moves = getDarkChessMoves(darkChessSelected.col, darkChessSelected.row);
        const canEat = moves.some(m => m.col === col && m.row === row);
        
        if (canEat) {
            // 執行吃子
            darkChessBoard[row][col] = darkChessBoard[darkChessSelected.row][darkChessSelected.col];
            darkChessBoard[darkChessSelected.row][darkChessSelected.col] = '';
            darkChessFlipped[row][col] = true;
            darkChessFlipped[darkChessSelected.row][darkChessSelected.col] = false;
            darkChessSelected = null;
            
            // 切換玩家
            darkChessCurrentPlayer = darkChessCurrentPlayer === 'red' ? 'black' : 'red';
            updateDarkChessUI();
            
            checkDarkChessWin();
            sound.capture();
        } else {
            darkChessSelected = null;
        }
        
        drawDarkChess();
    }
}

function getDarkChessMoves(col, row) {
    const piece = darkChessBoard[row][col];
    if (!piece || !darkChessFlipped[row][col]) return [];
    
    const isRed = '帥仕相俥傌兵'.includes(piece);
    const moves = [];
    
    // 獲取己方所有棋子位置
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (darkChessBoard[r][c] && darkChessFlipped[r][c]) {
                const p = darkChessBoard[r][c];
                const otherIsRed = '帥仕相俥傌兵'.includes(p);
                if ((isRed && otherIsRed) || (!isRed && !otherIsRed)) {
                    continue;
                }
                
                // 檢查是否能吃
                if (canCapture(piece, darkChessBoard[r][c])) {
                    moves.push({ col: c, row: r });
                }
            }
        }
    }
    
    return moves;
}

function canCapture(attacker, defender) {
    const aRank = pieceRank[attacker];
    const dRank = pieceRank[defender];
    
    // 大吃小
    if (aRank > dRank) return true;
    // 同級互換
    if (aRank === dRank) return true;
    // 兵可以吃將
    if (attacker === '兵' && defender === '將') return true;
    if (attacker === '卒' && defender === '帥') return true;
    
    return false;
}

function checkDarkChessWin() {
    let redCount = 0;
    let blackCount = 0;
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (darkChessBoard[r][c] && darkChessFlipped[r][c]) {
                if ('帥仕相俥傌兵'.includes(darkChessBoard[r][c])) {
                    redCount++;
                } else if ('將士象車馬炮卒'.includes(darkChessBoard[r][c])) {
                    blackCount++;
                }
            }
        }
    }
    
    if (redCount === 0) {
        alert('⚫ 黑方獲勝！');
        resetDarkChess();
    } else if (blackCount === 0) {
        alert('🔴 紅方獲勝！');
        resetDarkChess();
    }
}

function updateDarkChessUI() {
    const el = document.getElementById('darkChessTurn');
    el.textContent = darkChessCurrentPlayer === 'red' ? '🔴 紅方回合' : '⚫ 黑方回合';
    el.style.color = darkChessCurrentPlayer === 'red' ? '#ff4444' : '#fff';
}

function resetDarkChess() {
    initDarkChess();
    drawDarkChess();
    sound.button();
}

// 樣式
const dcStyle = document.createElement('style');
dcStyle.textContent = `
    .darkchess-container { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; }
    .darkchess-info { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 400px; }
    .darkchess-turn { font-size: 1.3rem; font-weight: bold; }
    .darkchess-btn { background: var(--tertiary); border: 1px solid var(--card-border); color: var(--text); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
    .darkchess-btn:hover { background: var(--accent); border-color: var(--accent); }
    #darkChessCanvas { border-radius: 8px; box-shadow: var(--glow); }
    .darkchess-rules { color: var(--text-dim); font-size: 0.9rem; text-align: center; }
`;
document.head.appendChild(dcStyle);
