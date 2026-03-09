(function() {
/* ============================================
   踩地雷遊戲
   ============================================ */
let mineBoard = [];
let revealed = [];
let flagged = [];
let mines = [];
let gameOverMine = false;
let firstClick = true;
let difficulty = 'easy'; // easy, medium, hard
let canvasMine, ctxMine;
let cellSizeMine = 30;
let mineCount = 10;
let boardRows = 9;
let boardCols = 9;
let flagsUsed = 0;
let timerMine = 0;
let timerIntervalMine = null;

// 難度設定
const difficulties = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="mine-container">
            <div class="mine-info">
                <div class="mine-stats">
                    <div class="stat">
                        <span>💣</span>
                        <span id="mineCount">${mineCount}</span>
                    </div>
                    <div class="stat">
                        <span>⏱️</span>
                        <span id="mineTimer">0</span>
                    </div>
                </div>
                <div class="mine-controls">
                    <button class="mine-btn" onclick="setDifficulty('easy')">😊 簡單</button>
                    <button class="mine-btn" onclick="setDifficulty('medium')">😐 中等</button>
                    <button class="mine-btn" onclick="setDifficulty('hard')">😰 困難</button>
                </div>
            </div>
            <canvas id="mineCanvas"></canvas>
            <div class="mine-result" id="mineResult" style="display:none;">
                <span id="mineResultText"></span>
                <button onclick="initMinesweeper()">再來一局</button>
            </div>
        </div>
    `;
    
    canvasMine = document.getElementById('mineCanvas');
    ctxMine = canvasMine.getContext('2d');
    
    initMinesweeper();
    
    canvasMine.addEventListener('click', handleMineClick);
    canvasMine.addEventListener('contextmenu', handleMineRightClick);
    canvasMine.addEventListener('touchstart', handleMineTouch, { passive: false });
}

function setDifficulty(level) {
    difficulty = level;
    initMinesweeper();
    sound.button();
}

function initMinesweeper() {
    const config = difficulties[difficulty];
    boardRows = config.rows;
    boardCols = config.cols;
    mineCount = config.mines;
    
    mineBoard = [];
    revealed = [];
    flagged = [];
    flagsUsed = 0;
    timerMine = 0;
    gameOverMine = false;
    firstClick = true;
    
    if (timerIntervalMine) clearInterval(timerIntervalMine);
    timerIntervalMine = setInterval(() => {
        if (!gameOverMine) {
            timerMine++;
            document.getElementById('mineTimer').textContent = timerMine;
        }
    }, 1000);
    
    // 初始化數組
    for (let r = 0; r < boardRows; r++) {
        mineBoard[r] = [];
        revealed[r] = [];
        flagged[r] = [];
        for (let c = 0; c < boardCols; c++) {
            mineBoard[r][c] = 0;
            revealed[r][c] = false;
            flagged[r][c] = false;
        }
    }
    
    resizeMineCanvas();
    drawMinesweeper();
    
    document.getElementById('mineCount').textContent = mineCount;
    document.getElementById('mineTimer').textContent = 0;
    document.getElementById('mineResult').style.display = 'none';
}

function resizeMineCanvas() {
    const container = canvasMine.parentElement;
    const maxWidth = Math.min(container.clientWidth - 20, 600);
    const maxHeight = container.clientHeight - 150;
    
    cellSizeMine = Math.min(
        Math.floor(maxWidth / boardCols),
        Math.floor(maxHeight / boardRows),
        40
    );
    
    canvasMine.width = boardCols * cellSizeMine;
    canvasMine.height = boardRows * cellSizeMine;
}

function placeMines(excludeRow, excludeCol) {
    mines = [];
    let placed = 0;
    
    while (placed < mineCount) {
        const r = Math.floor(Math.random() * boardRows);
        const c = Math.floor(Math.random() * boardCols);
        
        // 排除第一次點擊周圍
        if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue;
        
        if (mineBoard[r][c] !== -1) {
            mineBoard[r][c] = -1;
            mines.push({ r, c });
            placed++;
        }
    }
    
    // 計算數字
    for (let r = 0; r < boardRows; r++) {
        for (let c = 0; c < boardCols; c++) {
            if (mineBoard[r][c] === -1) continue;
            
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < boardRows && nc >= 0 && nc < boardCols && mineBoard[nr][nc] === -1) {
                        count++;
                    }
                }
            }
            mineBoard[r][c] = count;
        }
    }
}

function handleMineClick(e) {
    if (gameOverMine) return;
    
    const rect = canvasMine.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const c = Math.floor(x / cellSizeMine);
    const r = Math.floor(y / cellSizeMine);
    
    if (r < 0 || r >= boardRows || c < 0 || c >= boardCols) return;
    if (flagged[r][c]) return;
    
    if (firstClick) {
        firstClick = false;
        placeMines(r, c);
    }
    
    revealCell(r, c);
    drawMinesweeper();
}

function handleMineRightClick(e) {
    e.preventDefault();
    if (gameOverMine) return;
    
    const rect = canvasMine.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const c = Math.floor(x / cellSizeMine);
    const r = Math.floor(y / cellSizeMine);
    
    if (r < 0 || r >= boardRows || c < 0 || c >= boardCols) return;
    if (revealed[r][c]) return;
    
    flagged[r][c] = !flagged[r][c];
    flagsUsed += flagged[r][c] ? 1 : -1;
    
    document.getElementById('mineCount').textContent = mineCount - flagsUsed;
    drawMinesweeper();
    sound.click();
}

function handleMineTouch(e) {
    e.preventDefault();
    
    if (e.touches.length === 1) {
        handleMineClick(e);
    }
}

function revealCell(r, c) {
    if (revealed[r][c] || flagged[r][c]) return;
    
    revealed[r][c] = true;
    
    if (mineBoard[r][c] === -1) {
        // 踩到地雷
        gameOverMine = true;
        clearInterval(timerIntervalMine);
        revealAllMines();
        drawMinesweeper();
        
        document.getElementById('mineResultText').textContent = '💥 遊戲結束！';
        document.getElementById('mineResult').style.display = 'flex';
        
        sound.fail();
        return;
    }
    
    if (mineBoard[r][c] === 0) {
        // 空白，自動展開
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < boardRows && nc >= 0 && nc < boardCols) {
                    revealCell(nr, nc);
                }
            }
        }
    }
    
    // 檢查是否獲勝
    checkWin();
    
    sound.click();
}

function revealAllMines() {
    for (const { r, c } of mines) {
        revealed[r][c] = true;
    }
    drawMinesweeper();
}

function checkWin() {
    let unrevealedSafe = 0;
    
    for (let r = 0; r < boardRows; r++) {
        for (let c = 0; c < boardCols; c++) {
            if (!revealed[r][c] && mineBoard[r][c] !== -1) {
                unrevealedSafe++;
            }
        }
    }
    
    if (unrevealedSafe === 0) {
        gameOverMine = true;
        clearInterval(timerIntervalMine);
        
        document.getElementById('mineResultText').textContent = `🎉 恭喜獲勝！時間：${timerMine}秒`;
        document.getElementById('mineResult').style.display = 'flex';
        
        // 標記所有地雷
        for (const { r, c } of mines) {
            flagged[r][c] = true;
        }
        document.getElementById('mineCount').textContent = 0;
        drawMinesweeper();
        
        sound.win();
    }
}

function drawMinesweeper() {
    if (!ctxMine || !mineBoard || !mineBoard.length) return;
    // 背景
    ctxMine.fillStyle = '#1a1a2e';
    ctxMine.fillRect(0, 0, canvasMine.width, canvasMine.height);
    
    for (let r = 0; r < boardRows; r++) {
        for (let c = 0; c < boardCols; c++) {
            const x = c * cellSizeMine;
            const y = r * cellSizeMine;
            
            // 格子背景
            if (revealed[r][c]) {
                ctxMine.fillStyle = mineBoard[r][c] === -1 ? '#ff4444' : '#0f0f23';
            } else {
                ctxMine.fillStyle = '#2a2a4e';
            }
            
            ctxMine.fillRect(x + 1, y + 1, cellSizeMine - 2, cellSizeMine - 2);
            
            if (revealed[r][c] && mineBoard[r][c] !== -1 && mineBoard[r][c] > 0) {
                // 數字
                const colors = ['#00ff88', '#0088ff', '#ffaa00', '#ff4444', '#ff00aa', '#00ffff', '#ffffff', '#888888'];
                ctxMine.fillStyle = colors[mineBoard[r][c] - 1];
                ctxMine.font = `bold ${cellSizeMine * 0.6}px Arial`;
                ctxMine.textAlign = 'center';
                ctxMine.textBaseline = 'middle';
                ctxMine.fillText(mineBoard[r][c].toString(), x + cellSizeMine/2, y + cellSizeMine/2);
            }
            
            if (mineBoard[r][c] === -1 && revealed[r][c]) {
                // 地雷
                ctxMine.fillStyle = '#ff4444';
                ctxMine.beginPath();
                ctxMine.arc(x + cellSizeMine/2, y + cellSizeMine/2, cellSizeMine * 0.3, 0, Math.PI * 2);
                ctxMine.fill();
            }
            
            if (flagged[r][c]) {
                // 旗幟
                ctxMine.fillStyle = '#ff4444';
                ctxMine.font = `${cellSizeMine * 0.7}px Arial`;
                ctxMine.textAlign = 'center';
                ctxMine.textBaseline = 'middle';
                ctxMine.fillText('🚩', x + cellSizeMine/2, y + cellSizeMine/2);
            }
            
            // 邊框效果
            if (!revealed[r][c]) {
                ctxMine.strokeStyle = '#3a3a5e';
                ctxMine.strokeRect(x + 1, y + 1, cellSizeMine - 2, cellSizeMine - 2);
            }
        }
    }
}

// 樣式
const mineStyle = document.createElement('style');
mineStyle.textContent = `
    .mine-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
    }
    .mine-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
    }
    .mine-stats {
        display: flex;
        gap: 2rem;
    }
    .stat {
        font-size: 1.2rem;
        font-weight: bold;
    }
    .mine-controls {
        display: flex;
        gap: 0.5rem;
    }
    .mine-btn {
        background: var(--tertiary);
        border: 1px solid var(--card-border);
        color: var(--text);
        padding: 0.4rem 0.8rem;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 0.9rem;
        transition: var(--transition);
    }
    .mine-btn:hover {
        background: var(--accent);
        border-color: var(--accent);
    }
    #mineCanvas {
        border-radius: var(--radius-md);
        box-shadow: var(--glow);
    }
    .mine-result {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: var(--secondary);
        border-radius: var(--radius-md);
    }
    .mine-result span {
        font-size: 1.2rem;
        color: var(--accent3);
    }
    .mine-result button {
        background: var(--accent);
        border: none;
        color: var(--primary);
        padding: 0.6rem 1.5rem;
        border-radius: var(--radius-sm);
        cursor: pointer;
    }
`;
document.head.appendChild(mineStyle);
window.initGame = initGame;
})();
