(function() {
/* ============================================
   貪食蛇遊戲
   ============================================ */
let snake = [];
let direction = { x: 1, y: 0 };
let food = { x: 5, y: 5 };
let score = 0;
let gameLoop = null;
let gridSize = 20;
let canvas2, ctx2;
let gameSpeed = 150;
let powerUp = null;
let obstacles = [];

// 初始化遊戲
function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="snake-container">
            <div class="snake-info">
                <div class="score-display">
                    <span>分數：</span>
                    <span id="scoreValue">0</span>
                </div>
                <div class="snake-controls">
                    <button class="ctrl-btn" onclick="changeSpeed()">⚡ ${gameSpeed}ms</button>
                    <button class="ctrl-btn" onclick="toggleMode()" id="modeBtn">🌲 穿越</button>
                </div>
            </div>
            <canvas id="snakeCanvas"></canvas>
            <div class="snake-result" id="snakeResult" style="display:none;">
                <span id="snakeResultText"></span>
                <button onclick="resetSnake()">再來一局</button>
            </div>
        </div>
    `;
    
    canvas2 = document.getElementById('snakeCanvas');
    ctx2 = canvas2.getContext('2d');
    
    resizeSnakeCanvas();
    window.addEventListener('resize', resizeSnakeCanvas);
    
    initSnake();
    
    canvas2.addEventListener('touchstart', handleSnakeTouch, { passive: false });
    
    document.addEventListener('keydown', handleSnakeKey);
    
    drawSnake();
}

function resizeSnakeCanvas() {
    const container = canvas2.parentElement;
    const size = Math.min(container.clientWidth - 20, 500, container.clientHeight - 100);
    canvas2.width = size;
    canvas2.height = size;
    gridSize = Math.floor(size / 20);
}

function initSnake() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    score = 0;
    gameSpeed = 150;
    powerUp = null;
    obstacles = [];
    
    spawnFood();
    updateScore();
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(updateSnake, gameSpeed);
    
    document.getElementById('snakeResult').style.display = 'none';
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (canvas2.width / gridSize)),
        y: Math.floor(Math.random() * (canvas2.height / gridSize))
    };
    
    // 確保食物不在蛇身上
    for (const segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            spawnFood();
        }
    }
}

function spawnPowerUp() {
    if (Math.random() < 0.1 && !powerUp) {
        powerUp = {
            x: Math.floor(Math.random() * (canvas2.width / gridSize)),
            y: Math.floor(Math.random() * (canvas2.height / gridSize)),
            type: Math.random() < 0.5 ? 'slow' : 'score'
        };
    }
}

function updateSnake() {
    const head = { 
        x: snake[0].x + direction.x, 
        y: snake[0].y + direction.y 
    };
    
    const maxX = Math.floor(canvas2.width / gridSize);
    const maxY = Math.floor(canvas2.height / gridSize);
    
    // 檢查邊界
    if (head.x < 0 || head.x >= maxX || head.y < 0 || head.y >= maxY) {
        if (obstacles.length > 0) {
            // 穿越模式
            head.x = (head.x + maxX) % maxX;
            head.y = (head.y + maxY) % maxY;
        } else {
            gameOverSnake();
            return;
        }
    }
    
    // 檢查障礙物
    for (const obs of obstacles) {
        if (head.x === obs.x && head.y === obs.y) {
            gameOverSnake();
            return;
        }
    }
    
    // 檢查是否吃到自己
    for (let i = 0; i < snake.length - 1; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOverSnake();
            return;
        }
    }
    
    snake.unshift(head);
    
    // 檢查食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        sound.capture();
        spawnFood();
        
        if (score % 50 === 0) {
            gameSpeed = Math.max(50, gameSpeed - 10);
            clearInterval(gameLoop);
            gameLoop = setInterval(updateSnake, gameSpeed);
        }
    } else if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
        if (powerUp.type === 'slow') {
            gameSpeed = Math.min(300, gameSpeed + 30);
            clearInterval(gameLoop);
            gameLoop = setInterval(updateSnake, gameSpeed);
        } else {
            score += 30;
            sound.success();
        }
        powerUp = null;
    } else {
        snake.pop();
    }
    
    // 生成道具
    spawnPowerUp();
    
    updateScore();
    drawSnake();
}

function drawSnake() {
    if (!ctx2 || !snake || !snake.length) return;
    // 清空
    ctx2.fillStyle = '#0f0f23';
    ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
    
    // 繪製網格
    ctx2.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx2.lineWidth = 1;
    for (let x = 0; x <= canvas2.width; x += gridSize) {
        ctx2.beginPath();
        ctx2.moveTo(x, 0);
        ctx2.lineTo(x, canvas2.height);
        ctx2.stroke();
    }
    for (let y = 0; y <= canvas2.height; y += gridSize) {
        ctx2.beginPath();
        ctx2.moveTo(0, y);
        ctx2.lineTo(canvas2.width, y);
        ctx2.stroke();
    }
    
    // 障礙物
    ctx2.fillStyle = '#ff4444';
    for (const obs of obstacles) {
        ctx2.fillRect(obs.x * gridSize + 1, obs.y * gridSize + 1, gridSize - 2, gridSize - 2);
    }
    
    // 食物
    const gradient = ctx2.createRadialGradient(
        food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, 0,
        food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2
    );
    gradient.addColorStop(0, '#ff00aa');
    gradient.addColorStop(1, '#ff4444');
    ctx2.fillStyle = gradient;
    ctx2.beginPath();
    ctx2.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 1, 0, Math.PI * 2);
    ctx2.fill();
    
    // 道具
    if (powerUp) {
        ctx2.fillStyle = powerUp.type === 'slow' ? '#00ff88' : '#ffaa00';
        ctx2.beginPath();
        ctx2.arc(powerUp.x * gridSize + gridSize/2, powerUp.y * gridSize + gridSize/2, gridSize/3, 0, Math.PI * 2);
        ctx2.fill();
    }
    
    // 蛇
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        const isHead = i === 0;
        
        const gradient2 = ctx2.createRadialGradient(
            segment.x * gridSize + gridSize/2, segment.y * gridSize + gridSize/2, 0,
            segment.x * gridSize + gridSize/2, segment.y * gridSize + gridSize/2, gridSize/2
        );
        
        if (isHead) {
            gradient2.addColorStop(0, '#00ff88');
            gradient2.addColorStop(1, '#00aa55');
        } else {
            gradient2.addColorStop(0, '#00dd77');
            gradient2.addColorStop(1, '#008844');
        }
        
        ctx2.fillStyle = gradient2;
        
        const radius = isHead ? gridSize/2 - 1 : gridSize/2 - 2;
        ctx2.beginPath();
        ctx2.arc(segment.x * gridSize + gridSize/2, segment.y * gridSize + gridSize/2, radius, 0, Math.PI * 2);
        ctx2.fill();
        
        // 眼睛
        if (isHead) {
            ctx2.fillStyle = '#ffffff';
            const eyeOffset = gridSize * 0.2;
            const eyeSize = gridSize * 0.15;
            
            ctx2.beginPath();
            ctx2.arc(
                segment.x * gridSize + gridSize/2 + direction.x * eyeOffset,
                segment.y * gridSize + gridSize/2 + direction.y * eyeOffset - eyeOffset/2,
                eyeSize, 0, Math.PI * 2
            );
            ctx2.arc(
                segment.x * gridSize + gridSize/2 + direction.x * eyeOffset,
                segment.y * gridSize + gridSize/2 + direction.y * eyeOffset + eyeOffset/2,
                eyeSize, 0, Math.PI * 2
            );
            ctx2.fill();
        }
    }
}

function updateScore() {
    document.getElementById('scoreValue').textContent = score;
}

function gameOverSnake() {
    clearInterval(gameLoop);
    gameLoop = null;
    
    const result = document.getElementById('snakeResult');
    const text = document.getElementById('snakeResultText');
    
    text.textContent = `遊戲結束！分數：${score}`;
    result.style.display = 'flex';
    
    sound.lose();
}

function resetSnake() {
    initSnake();
    sound.button();
}

function changeSpeed() {
    gameSpeed = gameSpeed === 150 ? 100 : gameSpeed === 100 ? 50 : 150;
    clearInterval(gameLoop);
    gameLoop = setInterval(updateSnake, gameSpeed);
    document.querySelector('.ctrl-btn').textContent = `⚡ ${gameSpeed}ms`;
    sound.button();
}

function toggleMode() {
    obstacles = obstacles.length > 0 ? [] : generateObstacles();
    document.getElementById('modeBtn').textContent = obstacles.length > 0 ? '🏔️ 障礙' : '🌲 穿越';
    initSnake();
    sound.button();
}

function generateObstacles() {
    const obs = [];
    for (let i = 0; i < 15; i++) {
        obs.push({
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 20)
        });
    }
    return obs;
}

function handleSnakeKey(e) {
    const keyMap = {
        'ArrowUp': { x: 0, y: -1 },
        'ArrowDown': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 }
    };
    
    const newDir = keyMap[e.key];
    if (newDir && !(newDir.x + direction.x === 0 && newDir.y + direction.y === 0)) {
        direction = newDir;
        sound.click();
    }
}

function handleSnakeTouch(e) {
    e.preventDefault();
    
    if (e.touches.length < 2) {
        const touch = e.touches[0];
        const rect = canvas2.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const centerX = canvas2.width / 2;
        const centerY = canvas2.height / 2;
        
        const dx = x - centerX;
        const dy = y - centerY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        } else {
            direction = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        }
        
        sound.click();
    }
}

// 樣式
const snakeStyle = document.createElement('style');
snakeStyle.textContent = `
    .snake-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
    }
    .snake-info {
        display: flex;
        justify-content: space-between;
        width: 100%;
        max-width: 500px;
    }
    .score-display {
        font-size: 1.3rem;
        font-weight: bold;
    }
    .score-display span:last-child {
        color: var(--accent3);
    }
    .snake-controls {
        display: flex;
        gap: 0.5rem;
    }
    #snakeCanvas {
        border-radius: var(--radius-md);
        box-shadow: var(--glow);
    }
    .snake-result {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        background: var(--secondary);
        border-radius: var(--radius-md);
    }
    .snake-result span {
        font-size: 1.3rem;
    }
    .snake-result button {
        background: var(--accent);
        border: none;
        color: var(--primary);
        padding: 0.8rem 2rem;
        border-radius: var(--radius-sm);
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
    }
`;
document.head.appendChild(snakeStyle);
window.initGame = initGame;
})();
