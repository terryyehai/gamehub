(function() {
/* ============================================
   彈珠台遊戲 (Pinball)
   ============================================ */
let pinball = {
    ball: { x: 0, y: 0, vx: 0, vy: 0, radius: 8 },
    flippers: [],
    bumpers: [],
    walls: [],
    score: 0,
    lives: 3,
    state: 'ready' // ready, playing, gameover
};
let canvasPin, ctxPin;
let animationPin = null;
let gravity = 0.3;
let friction = 0.99;
let bounce = 0.7;

function cleanup() {
    window.removeEventListener('resize', resizeChessCanvas);
}

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="pinball-container">
            <div class="pinball-info">
                <div class="pinball-score">分數: <span id="pinballScore">0</span></div>
                <div class="pinball-lives">生命: <span id="pinballLives">3</span></div>
            </div>
            <canvas id="pinballCanvas"></canvas>
            <div class="pinball-controls">
                <button class="pinball-btn" onclick="startPinball()">▶ 開始</button>
                <button class="pinball-btn" onclick="resetPinball()">🔄 重置</button>
            </div>
            <p class="pinball-hint">← → 方向鍵控制擋板 | 空白鍵發球</p>
        </div>
    `;
    
    canvasPin = document.getElementById('pinballCanvas');
    ctxPin = canvasPin.getContext('2d');
    
    resizePinballCanvas();
    window.addEventListener('resize', resizePinballCanvas);
    
    initPinball();
    drawPinball();
    
    // 鍵盤控制
    document.addEventListener('keydown', handlePinballKey);
    document.addEventListener('keyup', handlePinballKeyUp);
}

function resizePinballCanvas() {
    const container = canvasPin.parentElement;
    const width = Math.min(container.clientWidth - 20, 400);
    const height = Math.min(container.clientHeight - 150, 600);
    canvasPin.width = width;
    canvasPin.height = height;
    initPinball();
    drawPinball();
}

function initPinball() {
    const w = canvasPin.width;
    const h = canvasPin.height;
    
    pinball.score = 0;
    pinball.lives = 3;
    pinball.state = 'ready';
    
    // 擋板
    pinball.flippers = [
        { x: w * 0.25, y: h - 60, length: 70, angle: Math.PI / 6, targetAngle: Math.PI / 6, side: 'left' },
        { x: w * 0.75, y: h - 60, length: 70, angle: Math.PI - Math.PI / 6, targetAngle: Math.PI - Math.PI / 6, side: 'right' }
    ];
    
    // 障礙物 (bumpers)
    pinball.bumpers = [
        { x: w * 0.3, y: h * 0.25, radius: 20, value: 10 },
        { x: w * 0.7, y: h * 0.25, radius: 20, value: 10 },
        { x: w * 0.5, y: h * 0.35, radius: 15, value: 20 },
        { x: w * 0.5, y: h * 0.15, radius: 25, value: 50 }
    ];
    
    // 牆壁
    pinball.walls = [
        { x1: 0, y1: 0, x2: w * 0.15, y2: h * 0.7, type: 'wall' },
        { x1: w, y1: 0, x2: w * 0.85, y2: h * 0.7, type: 'wall' },
        { x1: w * 0.15, y1: h * 0.7, x2: w * 0.85, y2: h * 0.7, type: 'wall' }
    ];
    
    resetBall();
    updatePinballUI();
}

function resetBall() {
    const w = canvasPin.width;
    const h = canvasPin.height;
    
    pinball.ball.x = w * 0.15;
    pinball.ball.y = h * 0.7;
    pinball.ball.vx = 0;
    pinball.ball.vy = 0;
    pinball.state = 'ready';
}

function startPinball() {
    if (pinball.state === 'ready') {
        pinball.state = 'playing';
        pinball.ball.vy = -12;
        pinball.ball.vx = (Math.random() - 0.5) * 4;
        gameLoopPinball();
        sound.gameStart();
    }
}

function gameLoopPinball() {
    if (pinball.state !== 'playing') return;
    
    updatePinball();
    drawPinball();
    
    if (pinball.state === 'playing') {
        animationPin = requestAnimationFrame(gameLoopPinball);
    }
}

function updatePinball() {
    const w = canvasPin.width;
    const h = canvasPin.height;
    const ball = pinball.ball;
    
    // 重力
    ball.vy += gravity;
    
    // 摩擦
    ball.vx *= friction;
    ball.vy *= friction;
    
    // 移動
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // 牆壁碰撞
    // 左牆
    if (ball.x < ball.radius) {
        ball.x = ball.radius;
        ball.vx = -ball.vx * bounce;
    }
    // 右牆
    if (ball.x > w - ball.radius) {
        ball.x = w - ball.radius;
        ball.vx = -ball.vx * bounce;
    }
    // 頂部
    if (ball.y < ball.radius) {
        ball.y = ball.radius;
        ball.vy = -ball.vy * bounce;
    }
    
    // 擋板碰撞
    pinball.flippers.forEach(flipper => {
        if (checkFlipperCollision(ball, flipper)) {
            // 計算反彈角度
            const dx = ball.x - flipper.x;
            const dy = ball.y - flipper.y;
            const angle = flipper.angle + Math.PI / 2;
            
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = Math.cos(angle) * speed * 1.2;
            ball.vy = Math.sin(angle) * speed * 1.2;
            
            sound.click();
        }
    });
    
    // Bumper 碰撞
    pinball.bumpers.forEach(bumper => {
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < ball.radius + bumper.radius) {
            // 彈開
            const angle = Math.atan2(dy, dx);
            ball.vx = Math.cos(angle) * 15;
            ball.vy = Math.sin(angle) * 15;
            
            pinball.score += bumper.value;
            updatePinballUI();
            sound.success();
        }
    });
    
    // 底部檢查 (失敗)
    if (ball.y > h + ball.radius) {
        pinball.lives--;
        updatePinballUI();
        
        if (pinball.lives <= 0) {
            pinball.state = 'gameover';
            showPinballGameOver();
            sound.lose();
        } else {
            resetBall();
        }
    }
    
    // 更新擋板角度
    pinball.flippers.forEach(f => {
        f.angle += (f.targetAngle - f.angle) * 0.3;
    });
}

function checkFlipperCollision(ball, flipper) {
    const endX = flipper.x + Math.cos(flipper.angle) * flipper.length;
    const endY = flipper.y + Math.sin(flipper.angle) * flipper.length;
    
    // 簡單的線段碰撞檢測
    const dx = endX - flipper.x;
    const dy = endY - flipper.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / len;
    const ny = dy / len;
    
    const px = ball.x - flipper.x;
    const py = ball.y - flipper.y;
    
    const proj = px * nx + py * ny;
    
    if (proj < 0 || proj > len) return false;
    
    const closestX = flipper.x + nx * proj;
    const closestY = flipper.y + ny * proj;
    
    const distX = ball.x - closestX;
    const distY = ball.y - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);
    
    if (dist < ball.radius + 5) {
        // 推到球
        const overlap = ball.radius + 5 - dist;
        ball.x += (distX / dist) * overlap;
        ball.y += (distY / dist) * overlap;
        return true;
    }
    return false;
}

function drawPinball() {
    if (!ctxPin) return;
    if (!ctxPin) return;
    
    const w = canvasPin.width;
    const h = canvasPin.height;
    
    // 背景
    ctxPin.fillStyle = '#0a0a1a';
    ctxPin.fillRect(0, 0, w, h);
    
    // 網格
    ctxPin.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctxPin.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
        ctxPin.beginPath();
        ctxPin.moveTo(x, 0);
        ctxPin.lineTo(x, h);
        ctxPin.stroke();
    }
    for (let y = 0; y < h; y += 20) {
        ctxPin.beginPath();
        ctxPin.moveTo(0, y);
        ctxPin.lineTo(w, y);
        ctxPin.stroke();
    }
    
    // 牆壁
    ctxPin.strokeStyle = '#00d4ff';
    ctxPin.lineWidth = 3;
    pinball.walls.forEach(wall => {
        ctxPin.beginPath();
        ctxPin.moveTo(wall.x1, wall.y1);
        ctxPin.lineTo(wall.x2, wall.y2);
        ctxPin.stroke();
    });
    
    // Bumpers
    pinball.bumpers.forEach(bumper => {
        const gradient = ctxPin.createRadialGradient(bumper.x, bumper.y, 0, bumper.x, bumper.y, bumper.radius);
        gradient.addColorStop(0, '#ff00aa');
        gradient.addColorStop(1, '#ff4444');
        
        ctxPin.fillStyle = gradient;
        ctxPin.beginPath();
        ctxPin.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
        ctxPin.fill();
        
        // 分數
        ctxPin.fillStyle = '#fff';
        ctxPin.font = 'bold 12px Arial';
        ctxPin.textAlign = 'center';
        ctxPin.textBaseline = 'middle';
        ctxPin.fillText(bumper.value, bumper.x, bumper.y);
    });
    
    // 擋板
    pinball.flippers.forEach(flipper => {
        const endX = flipper.x + Math.cos(flipper.angle) * flipper.length;
        const endY = flipper.y + Math.sin(flipper.angle) * flipper.length;
        
        ctxPin.strokeStyle = '#00ff88';
        ctxPin.lineWidth = 8;
        ctxPin.lineCap = 'round';
        
        ctxPin.beginPath();
        ctxPin.moveTo(flipper.x, flipper.y);
        ctxPin.lineTo(endX, endY);
        ctxPin.stroke();
        
        // 樞軸
        ctxPin.fillStyle = '#00ff88';
        ctxPin.beginPath();
        ctxPin.arc(flipper.x, flipper.y, 8, 0, Math.PI * 2);
        ctxPin.fill();
    });
    
    // 球
    const ball = pinball.ball;
    const ballGradient = ctxPin.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius);
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(1, '#00d4ff');
    
    ctxPin.fillStyle = ballGradient;
    ctxPin.beginPath();
    ctxPin.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctxPin.fill();
    
    // 遊戲結束
    if (pinball.state === 'gameover') {
        ctxPin.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctxPin.fillRect(0, 0, w, h);
        
        ctxPin.fillStyle = '#ff4444';
        ctxPin.font = 'bold 40px Arial';
        ctxPin.textAlign = 'center';
        ctxPin.fillText('GAME OVER', w / 2, h / 2);
        
        ctxPin.fillStyle = '#fff';
        ctxPin.font = '20px Arial';
        ctxPin.fillText(`最終分數: ${pinball.score}`, w / 2, h / 2 + 40);
    }
    
    // 準備發球
    if (pinball.state === 'ready') {
        ctxPin.fillStyle = '#00ff88';
        ctxPin.font = '20px Arial';
        ctxPin.textAlign = 'center';
        ctxPin.fillText('按 空白鍵 發球', w / 2, h - 100);
    }
}

function handlePinballKey(e) {
    const w = canvasPin.width;
    
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        pinball.flippers[0].targetAngle = -Math.PI / 6;
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        pinball.flippers[1].targetAngle = Math.PI + Math.PI / 6;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (pinball.state === 'ready') {
            startPinball();
        }
    }
}

function handlePinballKeyUp(e) {
    const w = canvasPin.width;
    
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        pinball.flippers[0].targetAngle = Math.PI / 6;
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        pinball.flippers[1].targetAngle = Math.PI - Math.PI / 6;
    }
}

function updatePinballUI() {
    document.getElementById('pinballScore').textContent = pinball.score;
    document.getElementById('pinballLives').textContent = pinball.lives;
}

function showPinballGameOver() {
    if (animationPin) {
        cancelAnimationFrame(animationPin);
    }
    drawPinball();
}

function resetPinball() {
    if (animationPin) {
        cancelAnimationFrame(animationPin);
    }
    initPinball();
    drawPinball();
    sound.button();
}

// 樣式
const pinballStyle = document.createElement('style');
pinballStyle.textContent = `
    .pinball-container { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; }
    .pinball-info { display: flex; justify-content: space-between; width: 100%; max-width: 400px; }
    .pinball-score, .pinball-lives { font-size: 1.2rem; font-weight: bold; }
    .pinball-score { color: var(--accent); }
    .pinball-lives { color: var(--accent2); }
    #pinballCanvas { border-radius: 12px; box-shadow: var(--glow); }
    .pinball-controls { display: flex; gap: 1rem; }
    .pinball-btn {
        background: var(--tertiary); border: 1px solid var(--card-border);
        color: var(--text); padding: 0.5rem 1.5rem; border-radius: 8px;
        cursor: pointer; transition: transform 0.2s;
    }
    .pinball-btn:hover { background: var(--accent); border-color: var(--accent); transform: scale(1.05); }
    .pinball-hint { color: var(--text-dim); font-size: 0.8rem; }
`;
document.head.appendChild(pinballStyle);
window.cleanup = cleanup;
    window.initGame = initGame;
})();
