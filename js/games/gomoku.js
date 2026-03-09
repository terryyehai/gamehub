/* ============================================
   五子棋遊戲
   ============================================ */
let BOARD_SIZE = 15;
let board = [];
let currentPlayer = 1; // 1: 黑棋, 2: 白棋
let gameOver = false;
let vsAI = false;
let canvas, ctx;
let cellSize;
let boardPadding = 30;
let lastMove = null;

// 初始化遊戲
function initGame(container) {
    const content = document.getElementById('gameContent');
    
    // 創建遊戲界面
    content.innerHTML = `
        <div class="gomoku-container">
            <div class="gomoku-info">
                <div class="player-indicator" id="playerIndicator">
                    <span class="piece black"></span>
                    <span id="playerText">黑棋回合</span>
                </div>
                <div class="game-controls">
                    <button class="ctrl-btn" onclick="changeBoardSize()" title="切換棋盤">📐 ${BOARD_SIZE}x${BOARD_SIZE}</button>
                    <button class="ctrl-btn" onclick="toggleAI()" title="對戰模式">🤖 ${vsAI ? '對人' : '對AI'}</button>
                </div>
            </div>
            <canvas id="gameCanvas"></canvas>
            <div class="gomoku-result" id="resultDisplay" style="display:none;">
                <span id="resultText"></span>
                <button onclick="resetGame()">再來一局</button>
            </div>
        </div>
    `;
    
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 設定畫布大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化棋盤
    initBoard();
    
    // 綁定點擊事件
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    
    // 鍵盤控制
    document.addEventListener('keydown', handleKey);
    
    // 初始繪製
    draw();
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth - 20, container.clientHeight - 20, 500);
    
    canvas.width = size;
    canvas.height = size;
    
    cellSize = (size - boardPadding * 2) / (BOARD_SIZE - 1);
    
    draw();
}

function initBoard() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    lastMove = null;
    updateUI();
}

function draw() {
    if (!ctx) return;
    
    // 清空畫布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 繪製網格
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 橫線
        ctx.beginPath();
        ctx.moveTo(boardPadding, boardPadding + i * cellSize);
        ctx.lineTo(boardPadding + (BOARD_SIZE - 1) * cellSize, boardPadding + i * cellSize);
        ctx.stroke();
        
        // 豎線
        ctx.beginPath();
        ctx.moveTo(boardPadding + i * cellSize, boardPadding);
        ctx.lineTo(boardPadding + i * cellSize, boardPadding + (BOARD_SIZE - 1) * cellSize);
        ctx.stroke();
    }
    
    // 繪製星位 (天元)
    const starPoints = [
        [3, 3], [3, 11], [11, 3], [11, 11],
        [7, 7]
    ];
    
    starPoints.forEach(([x, y]) => {
        if (x < BOARD_SIZE && y < BOARD_SIZE) {
            ctx.beginPath();
            ctx.arc(
                boardPadding + x * cellSize,
                boardPadding + y * cellSize,
                4, 0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
            ctx.fill();
        }
    });
    
    // 繪製棋子
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== 0) {
                drawPiece(x, y, board[y][x]);
            }
        }
    }
    
    // 繪製最後一手標記
    if (lastMove) {
        const { x, y, player } = lastMove;
        ctx.beginPath();
        ctx.arc(
            boardPadding + x * cellSize,
            boardPadding + y * cellSize,
            cellSize * 0.15,
            0, Math.PI * 2
        );
        ctx.strokeStyle = player === 1 ? '#ff00aa' : '#00ff88';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawPiece(x, y, player) {
    const cx = boardPadding + x * cellSize;
    const cy = boardPadding + y * cellSize;
    const radius = cellSize * 0.42;
    
    // 陰影
    ctx.beginPath();
    ctx.arc(cx + 2, cy + 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    
    // 棋子漸層
    const gradient = ctx.createRadialGradient(
        cx - radius * 0.3, cy - radius * 0.3, 0,
        cx, cy, radius
    );
    
    if (player === 1) {
        // 黑棋
        gradient.addColorStop(0, '#444444');
        gradient.addColorStop(0.5, '#111111');
        gradient.addColorStop(1, '#000000');
    } else {
        // 白棋
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#dddddd');
        gradient.addColorStop(1, '#aaaaaa');
    }
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 棋子光澤
    ctx.beginPath();
    ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
}

function handleClick(e) {
    if (gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    placePiece(x, y);
}

function handleTouch(e) {
    e.preventDefault();
    if (gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    placePiece(x, y);
}

function handleKey(e) {
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
    }
}

function placePiece(screenX, screenY) {
    // 計算最近的交叉點
    const x = Math.round((screenX - boardPadding) / cellSize);
    const y = Math.round((screenY - boardPadding) / cellSize);
    
    // 檢查是否在棋盤範圍內
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;
    
    // 檢查是否已有棋子
    if (board[y][x] !== 0) return;
    
    // 檢查距離是否太遠
    const exactX = boardPadding + x * cellSize;
    const exactY = boardPadding + y * cellSize;
    const dist = Math.sqrt((screenX - exactX) ** 2 + (screenY - exactY) ** 2);
    if (dist > cellSize * 0.6) return;
    
    // 放置棋子
    board[y][x] = currentPlayer;
    lastMove = { x, y, player: currentPlayer };
    
    sound.move();
    draw();
    
    // 檢查獲勝
    if (checkWin(x, y, currentPlayer)) {
        gameOver = true;
        showResult(currentPlayer);
        sound.win();
        return;
    }
    
    // 切換玩家
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateUI();
    
    // AI 回合
    if (vsAI && currentPlayer === 2 && !gameOver) {
        setTimeout(aiMove, 500);
    }
}

function aiMove() {
    // 簡單的 AI - 隨機但有點智慧
    let bestMove = null;
    let bestScore = -Infinity;
    
    // 評估每個空位
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0) {
                // 檢查周圍有沒有棋子
                let hasNeighbor = false;
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < BOARD_SIZE && nx >= 0 && nx < BOARD_SIZE) {
                            if (board[ny][nx] !== 0) hasNeighbor = true;
                        }
                    }
                }
                
                if (hasNeighbor) {
                    // 評分
                    let score = Math.random() * 10;
                    
                    // 攻擊得分
                    if (countLine(x, y, 2, 1) >= 4) score += 100;
                    if (countLine(x, y, 2, 2) >= 4) score += 80;
                    if (countLine(x, y, 2, 3) >= 3) score += 40;
                    if (countLine(x, y, 2, 4) >= 3) score += 20;
                    
                    // 防守得分
                    if (countLine(x, y, 1, 1) >= 4) score += 90;
                    if (countLine(x, y, 1, 2) >= 4) score += 70;
                    if (countLine(x, y, 1, 3) >= 3) score += 30;
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { x, y };
                    }
                }
            }
        }
    }
    
    // 如果沒有好位置，隨機選一個
    if (!bestMove) {
        const emptySpots = [];
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0) emptySpots.push({ x, y });
            }
        }
        if (emptySpots.length > 0) {
            bestMove = emptySpots[Math.floor(Math.random() * emptySpots.length)];
        }
    }
    
    if (bestMove) {
        board[bestMove.y][bestMove.x] = 2;
        lastMove = { x: bestMove.x, y: bestMove.y, player: 2 };
        sound.move();
        draw();
        
        if (checkWin(bestMove.x, bestMove.y, 2)) {
            gameOver = true;
            showResult(2);
            sound.lose();
            return;
        }
        
        currentPlayer = 1;
        updateUI();
    }
}

function countLine(x, y, player, direction) {
    let count = 0;
    const directions = [
        [1, 0],   // 橫
        [0, 1],   // 豎
        [1, 1],   // 對角線 \
        [1, -1]   // 對角線 /
    ];
    
    const [dx, dy] = directions[direction];
    
    // 正方向
    for (let i = 1; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
            count++;
        } else break;
    }
    
    // 反方向
    for (let i = 1; i < 5; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
            count++;
        } else break;
    }
    
    return count;
}

function checkWin(x, y, player) {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    
    for (const [dx, dy] of directions) {
        let count = 1;
        
        // 正方向
        for (let i = 1; i < 5; i++) {
            const nx = x + dx * i;
            const ny = y + dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else break;
        }
        
        // 反方向
        for (let i = 1; i < 5; i++) {
            const nx = x - dx * i;
            const ny = y - dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else break;
        }
        
        if (count >= 5) return true;
    }
    
    return false;
}

function showResult(player) {
    const result = document.getElementById('resultDisplay');
    const text = document.getElementById('resultText');
    
    text.textContent = player === 1 ? '黑棋獲勝！🎉' : (vsAI ? '電腦獲勝！🤖' : '白棋獲勝！🎉');
    text.style.color = player === 1 ? '#ff00aa' : '#00ff88';
    result.style.display = 'flex';
}

function resetGame() {
    initBoard();
    draw();
    document.getElementById('resultDisplay').style.display = 'none';
    sound.button();
}

function changeBoardSize() {
    BOARD_SIZE = BOARD_SIZE === 15 ? 19 : 15;
    resetGame();
    resizeCanvas();
    sound.button();
}

function toggleAI() {
    vsAI = !vsAI;
    resetGame();
    sound.button();
}

function updateUI() {
    const indicator = document.getElementById('playerIndicator');
    const text = document.getElementById('playerText');
    
    if (currentPlayer === 1) {
        indicator.innerHTML = '<span class="piece black"></span><span id="playerText">黑棋回合</span>';
    } else {
        indicator.innerHTML = '<span class="piece white"></span><span id="playerText">' + (vsAI ? '電腦思考中...' : '白棋回合') + '</span>';
    }
}

function cleanup() {
    window.removeEventListener('resize', resizeCanvas);
    canvas?.removeEventListener('click', handleClick);
    canvas?.removeEventListener('touchstart', handleTouch);
}

// 樣式
const style = document.createElement('style');
style.textContent = `
    .gomoku-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
    }
    .gomoku-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        max-width: 500px;
    }
    .player-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.2rem;
        font-weight: bold;
    }
    .piece {
        width: 24px;
        height: 24px;
        border-radius: 50%;
    }
    .piece.black {
        background: linear-gradient(135deg, #444, #000);
        box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }
    .piece.white {
        background: linear-gradient(135deg, #fff, #ccc);
        box-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .game-controls {
        display: flex;
        gap: 0.5rem;
    }
    .ctrl-btn {
        background: var(--tertiary);
        border: 1px solid var(--card-border);
        color: var(--text);
        padding: 0.5rem 1rem;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 0.9rem;
        transition: var(--transition);
    }
    .ctrl-btn:hover {
        background: var(--accent);
        border-color: var(--accent);
    }
    #gameCanvas {
        border-radius: var(--radius-md);
        box-shadow: var(--glow);
    }
    .gomoku-result {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        background: var(--secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--card-border);
    }
    .gomoku-result span {
        font-size: 1.5rem;
        font-weight: bold;
    }
    .gomoku-result button {
        background: var(--accent);
        border: none;
        color: var(--primary);
        padding: 0.8rem 2rem;
        border-radius: var(--radius-sm);
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: var(--transition);
    }
    .gomoku-result button:hover {
        transform: scale(1.05);
        box-shadow: var(--glow);
    }
`;
document.head.appendChild(style);
