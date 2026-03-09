(function() {
/* ============================================
   俄羅斯方塊 (Tetris)
   ============================================ */
let tetrisBoard = [];
let tetrisPiece = null;
let tetrisScore = 0;
let tetrisLevel = 1;
let tetrisGameOver = false;
let tetrisInterval = null;
let canvasTetris, ctxTetris;
let blockSize = 25;
let boardWidth = 10;
let boardHeight = 20;

const tetrisShapes = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[1,1,1],[0,1,0]], // T
    [[1,1,1],[1,0,0]], // L
    [[1,1,1],[0,0,1]], // J
    [[1,1,0],[0,1,1]], // S
    [[0,1,1],[1,1,0]]  // Z
];

const tetrisColors = [
    '#00ffff', // I - 青色
    '#ffff00', // O - 黃色
    '#ff00ff', // T - 紫色
    '#ff8800', // L - 橙色
    '#0000ff', // J - 藍色
    '#00ff00', // S - 綠色
    '#ff0000'  // Z - 紅色
];

function cleanup() {
    if (tetrisInterval) {
        clearInterval(tetrisInterval);
        tetrisInterval = null;
    }
    window.removeEventListener('keydown', handleTetrisKey);
}

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="tetris-container">
            <div class="tetris-info">
                <div class="tetris-score">分數: <span id="tetrisScore">0</span></div>
                <div class="tetris-level">等級: <span id="tetrisLevel">1</span></div>
            </div>
            <canvas id="tetrisCanvas"></canvas>
            <div class="tetris-controls">
                <button class="tetris-btn" onclick="startTetris()">▶ 開始</button>
                <button class="tetris-btn" onclick="resetTetris()">🔄 重置</button>
            </div>
            <p class="tetris-hint">← → 移動 | ↑ 旋轉 | ↓ 加速</p>
        </div>
    `;
    
    canvasTetris = document.getElementById('tetrisCanvas');
    ctxTetris = canvasTetris.getContext('2d');
    
    resizeTetrisCanvas();
    window.addEventListener('keydown', handleTetrisKey);
    
    initTetris();
    drawTetris();
}

function resizeTetrisCanvas() {
    const container = canvasTetris.parentElement;
    const maxWidth = Math.min(container.clientWidth - 20, 300);
    const maxHeight = container.clientHeight - 150;
    
    blockSize = Math.min(Math.floor(maxWidth / boardWidth), Math.floor(maxHeight / boardHeight), 30);
    
    canvasTetris.width = blockSize * boardWidth;
    canvasTetris.height = blockSize * boardHeight;
    drawTetris();
}

function initTetris() {
    tetrisBoard = [];
    for (let r = 0; r < boardHeight; r++) {
        tetrisBoard[r] = [];
        for (let c = 0; c < boardWidth; c++) {
            tetrisBoard[r][c] = 0;
        }
    }
    
    tetrisScore = 0;
    tetrisLevel = 1;
    tetrisGameOver = false;
    
    if (tetrisInterval) clearInterval(tetrisInterval);
    
    updateTetrisUI();
    spawnPiece();
}

function spawnPiece() {
    const type = Math.floor(Math.random() * tetrisShapes.length);
    tetrisPiece = {
        shape: tetrisShapes[type].map(row => [...row]),
        color: tetrisColors[type],
        x: Math.floor(boardWidth / 2) - 1,
        y: 0
    };
    
    // 檢查遊戲結束
    if (!canMove(0, 0)) {
        tetrisGameOver = true;
        if (tetrisInterval) clearInterval(tetrisInterval);
        showTetrisGameOver();
    }
}

function canMove(dx, dy, shape) {
    const s = shape || tetrisPiece.shape;
    for (let r = 0; r < s.length; r++) {
        for (let c = 0; c < s[r].length; c++) {
            if (s[r][c]) {
                const newX = tetrisPiece.x + c + dx;
                const newY = tetrisPiece.y + r + dy;
                
                if (newX < 0 || newX >= boardWidth || newY >= boardHeight) return false;
                if (newY >= 0 && tetrisBoard[newY][newX]) return false;
            }
        }
    }
    return true;
}

function rotatePiece() {
    const oldShape = tetrisPiece.shape;
    const newShape = [];
    
    for (let c = 0; c < oldShape[0].length; c++) {
        newShape[c] = [];
        for (let r = oldShape.length - 1; r >= 0; r--) {
            newShape[c].push(oldShape[r][c]);
        }
    }
    
    // 嘗試旋轉，如果不行就嘗試位移
    if (canMove(0, 0, newShape)) {
        tetrisPiece.shape = newShape;
    } else if (canMove(-1, 0, newShape)) {
        tetrisPiece.x -= 1;
        tetrisPiece.shape = newShape;
    } else if (canMove(1, 0, newShape)) {
        tetrisPiece.x += 1;
        tetrisPiece.shape = newShape;
    }
}

function mergePiece() {
    for (let r = 0; r < tetrisPiece.shape.length; r++) {
        for (let c = 0; c < tetrisPiece.shape[r].length; c++) {
            if (tetrisPiece.shape[r][c]) {
                const y = tetrisPiece.y + r;
                const x = tetrisPiece.x + c;
                if (y >= 0) tetrisBoard[y][x] = tetrisPiece.color;
            }
        }
    }
    
    clearLines();
    spawnPiece();
    sound.move();
}

function clearLines() {
    let lines = 0;
    
    for (let r = boardHeight - 1; r >= 0; r--) {
        let full = true;
        for (let c = 0; c < boardWidth; c++) {
            if (!tetrisBoard[r][c]) {
                full = false;
                break;
            }
        }
        
        if (full) {
            lines++;
            // 移除這行
            for (let y = r; y > 0; y--) {
                for (let c = 0; c < boardWidth; c++) {
                    tetrisBoard[y][c] = tetrisBoard[y-1][c];
                }
            }
            for (let c = 0; c < boardWidth; c++) {
                tetrisBoard[0][c] = 0;
            }
            r++; // 重新檢查這行
        }
    }
    
    if (lines > 0) {
        tetrisScore += lines * 100 * lines;
        tetrisLevel = Math.floor(tetrisScore / 1000) + 1;
        
        if (tetrisInterval) {
            clearInterval(tetrisInterval);
            tetrisInterval = setInterval(updateTetris, Math.max(100, 500 - tetrisLevel * 50));
        }
        
        updateTetrisUI();
        sound.success();
    }
}

function updateTetris() {
    if (tetrisGameOver) return;
    
    if (canMove(0, 1)) {
        tetrisPiece.y++;
    } else {
        mergePiece();
    }
    
    drawTetris();
}

function drawTetris() {
    if (!ctxTetris) return;
    
    // 清空
    ctxTetris.fillStyle = '#0a0a1a';
    ctxTetris.fillRect(0, 0, canvasTetris.width, canvasTetris.height);
    
    // 網格
    ctxTetris.strokeStyle = 'rgba(255,255,255,0.1)';
    ctxTetris.lineWidth = 1;
    for (let c = 0; c <= boardWidth; c++) {
        ctxTetris.beginPath();
        ctxTetris.moveTo(c * blockSize, 0);
        ctxTetris.lineTo(c * blockSize, canvasTetris.height);
        ctxTetris.stroke();
    }
    for (let r = 0; r <= boardHeight; r++) {
        ctxTetris.beginPath();
        ctxTetris.moveTo(0, r * blockSize);
        ctxTetris.lineTo(canvasTetris.width, r * blockSize);
        ctxTetris.stroke();
    }
    
    // 方塊
    for (let r = 0; r < boardHeight; r++) {
        for (let c = 0; c < boardWidth; c++) {
            if (tetrisBoard[r][c]) {
                drawBlock(c, r, tetrisBoard[r][c]);
            }
        }
    }
    
    // 當前方塊
    if (tetrisPiece && !tetrisGameOver) {
        for (let r = 0; r < tetrisPiece.shape.length; r++) {
            for (let c = 0; c < tetrisPiece.shape[r].length; c++) {
                if (tetrisPiece.shape[r][c]) {
                    drawBlock(tetrisPiece.x + c, tetrisPiece.y + r, tetrisPiece.color);
                }
            }
        }
    }
}

function drawBlock(x, y, color) {
    const px = x * blockSize;
    const py = y * blockSize;
    
    ctxTetris.fillStyle = color;
    ctxTetris.fillRect(px + 1, py + 1, blockSize - 2, blockSize - 2);
    
    // 高光
    ctxTetris.fillStyle = 'rgba(255,255,255,0.3)';
    ctxTetris.fillRect(px + 2, py + 2, blockSize - 4, 3);
    
    // 陰影
    ctxTetris.fillStyle = 'rgba(0,0,0,0.3)';
    ctxTetris.fillRect(px + 2, py + blockSize - 5, blockSize - 4, 3);
}

function handleTetrisKey(e) {
    if (tetrisGameOver || !tetrisPiece) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            if (canMove(-1, 0)) tetrisPiece.x--;
            break;
        case 'ArrowRight':
            if (canMove(1, 0)) tetrisPiece.x++;
            break;
        case 'ArrowDown':
            if (canMove(0, 1)) tetrisPiece.y++;
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
    }
    drawTetris();
}

function startTetris() {
    if (tetrisGameOver) {
        initTetris();
    }
    if (!tetrisInterval) {
        tetrisInterval = setInterval(updateTetris, Math.max(100, 500 - tetrisLevel * 50));
        sound.gameStart();
    }
}

function resetTetris() {
    initTetris();
    drawTetris();
    sound.button();
}

function updateTetrisUI() {
    document.getElementById('tetrisScore').textContent = tetrisScore;
    document.getElementById('tetrisLevel').textContent = tetrisLevel;
}

function showTetrisGameOver() {
    sound.lose();
}

// 樣式
const tetrisStyle = document.createElement('style');
tetrisStyle.textContent = `
    .tetris-container { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.5rem; }
    .tetris-info { display: flex; gap: 2rem; font-size: 1.1rem; }
    .tetris-score { color: var(--accent); }
    .tetris-level { color: var(--accent2); }
    #tetrisCanvas { border: 2px solid var(--accent); border-radius: 4px; }
    .tetris-controls { display: flex; gap: 1rem; }
    .tetris-btn {
        background: var(--tertiary); border: 1px solid var(--card-border);
        color: var(--text); padding: 0.5rem 1.5rem; border-radius: 8px;
        cursor: pointer;
    }
    .tetris-btn:hover { background: var(--accent); }
    .tetris-hint { color: var(--text-dim); font-size: 0.8rem; }
`;
document.head.appendChild(tetrisStyle);

window.initGame = initGame;
window.cleanup = cleanup;
})();
