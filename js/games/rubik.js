(function() {
/* ============================================
   魔術方塊遊戲 (Rubik's Cube)
   ============================================ */
let cube = [];
let isAnimating = false;
let canvasRubik, ctxRubik;
let cubeSize = 60;
let faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
let faceColors = {
    front: '#ff4444',  // 紅
    back: '#ff8800',   // 橙
    left: '#00aa00',    // 綠
    right: '#0066ff',   // 藍
    top: '#ffffff',     // 白
    bottom: '#ffff00'   // 黃
};

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="rubik-container">
            <div class="rubik-controls">
                <button class="rubik-btn" onclick="scrambleCube()">🔀 洗亂</button>
                <button class="rubik-btn" onclick="resetRubik()">🔄 重置</button>
            </div>
            <canvas id="rubikCanvas"></canvas>
            <div class="rubik-instructions">
                <p>點擊面旋轉 | 支援觸控滑動</p>
            </div>
        </div>
    `;
    
    canvasRubik = document.getElementById('rubikCanvas');
    ctxRubik = canvasRubik.getContext('2d');
    
    resizeRubikCanvas();
    window.addEventListener('resize', resizeRubikCanvas);
    
    initRubik();
    drawRubik();
    
    // 綁定事件
    canvasRubik.addEventListener('click', handleRubikClick);
    canvasRubik.addEventListener('touchstart', handleRubikTouch, { passive: false });
}

function resizeRubikCanvas() {
    const container = canvasRubik.parentElement;
    const size = Math.min(container.clientWidth - 40, 400);
    canvasRubik.width = size;
    canvasRubik.height = size;
    cubeSize = size / 4;
    drawRubik();
}

function initRubik() {
    cube = {};
    faces.forEach(face => {
        cube[face] = [];
        for (let i = 0; i < 9; i++) {
            cube[face].push(faceColors[face]);
        }
    });
}

function drawRubik() {
    if (!ctxRubik || !cube) return;
    if (!ctxRubik) return;
    
    ctxRubik.fillStyle = '#1a1a2e';
    ctxRubik.fillRect(0, 0, canvasRubik.width, canvasRubik.height);
    
    // 繪製三個可見的面
    // 前面
    drawFace('front', cubeSize * 0.5, cubeSize * 0.5);
    // 上面
    drawFaceTop('top', cubeSize * 0.5, cubeSize * 0);
    // 右面
    drawFaceRight('right', cubeSize, cubeSize * 0.5);
}

function drawFace(face, offsetX, offsetY) {
    const size = cubeSize;
    
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const idx = row * 3 + col;
            const color = cube[face][idx];
            
            ctxRubik.fillStyle = color;
            ctxRubik.fillRect(
                offsetX + col * size + 2,
                offsetY + row * size + 2,
                size - 4, size - 4
            );
            
            // 邊框
            ctxRubik.strokeStyle = '#000';
            ctxRubik.lineWidth = 2;
            ctxRubik.strokeRect(
                offsetX + col * size + 2,
                offsetY + row * size + 2,
                size - 4, size - 4
            );
        }
    }
}

function drawFaceTop(face, offsetX, offsetY) {
    const size = cubeSize;
    const skew = size * 0.5;
    
    ctxRubik.save();
    ctxRubik.transform(1, -0.5, 0, 1, 0, 0);
    
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const idx = row * 3 + col;
            const color = cube[face][idx];
            
            ctxRubik.fillStyle = color;
            const x = (offsetX + col * size) / 1;
            const y = (offsetY + row * size) * 1;
            ctxRubik.fillRect(x, y, size - 4, size - 4);
        }
    }
    
    ctxRubik.restore();
}

function drawFaceRight(face, offsetX, offsetY) {
    const size = cubeSize;
    const skew = size * 0.5;
    
    ctxRubik.save();
    ctxRubik.transform(1, 0.5, 0, 1, 0, 0);
    
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const idx = row * 3 + col;
            const color = cube[face][idx];
            
            ctxRubik.fillStyle = color;
            const x = (offsetX + col * size) / 1;
            const y = (offsetY + row * size) * 1;
            ctxRubik.fillRect(x, y, size - 4, size - 4);
        }
    }
    
    ctxRubik.restore();
}

function handleRubikClick(e) {
    if (isAnimating) return;
    
    const rect = canvasRubik.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 簡單的旋轉邏輯
    const face = detectFace(x, y);
    if (face) {
        rotateFace(face);
    }
}

function handleRubikTouch(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        handleRubikClick(e.touches[0]);
    }
}

function detectFace(x, y) {
    const size = cubeSize;
    
    // 檢測點擊在哪個面
    if (x < size * 3.5 && y < size * 3.5 && y > size * 0.5 - (x - size * 0.5) * 0.5) {
        return 'front';
    }
    if (x > size * 3.5 && y < size * 3.5 - (x - size * 3.5) * 0.5) {
        return 'right';
    }
    if (y < size * 0.5 && x < size * 3.5) {
        return 'top';
    }
    return null;
}

function rotateFace(face) {
    isAnimating = true;
    
    // 順時針旋轉面
    const f = cube[face];
    const temp = [f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], f[8]];
    f[0] = temp[6]; f[1] = temp[3]; f[2] = temp[0];
    f[3] = temp[7]; f[4] = temp[4]; f[5] = temp[1];
    f[6] = temp[8]; f[7] = temp[5]; f[8] = temp[2];
    
    // 旋轉相鄰邊
    rotateEdges(face);
    
    drawRubik();
    sound.move();
    
    setTimeout(() => {
        isAnimating = false;
    }, 200);
}

function rotateEdges(face) {
    const temp = [];
    
    switch(face) {
        case 'front':
            temp[0] = cube.top[6]; temp[1] = cube.top[7]; temp[2] = cube.top[8];
            cube.top[6] = cube.left[8]; cube.top[7] = cube.left[5]; cube.top[8] = cube.left[2];
            cube.left[2] = cube.bottom[0]; cube.left[5] = cube.bottom[1]; cube.left[8] = cube.bottom[2];
            cube.bottom[0] = cube.right[6]; cube.bottom[1] = cube.right[3]; cube.bottom[2] = cube.right[0];
            cube.right[0] = temp[0]; cube.right[3] = temp[1]; cube.right[6] = temp[2];
            break;
        case 'top':
            temp[0] = cube.front[0]; temp[1] = cube.front[1]; temp[2] = cube.front[2];
            cube.front[0] = cube.right[0]; cube.front[1] = cube.right[1]; cube.front[2] = cube.right[2];
            cube.right[0] = cube.back[0]; cube.right[1] = cube.back[1]; cube.right[2] = cube.back[2];
            cube.back[0] = cube.left[0]; cube.back[1] = cube.left[1]; cube.back[2] = cube.left[2];
            cube.left[0] = temp[0]; cube.left[1] = temp[1]; cube.left[2] = temp[2];
            break;
        case 'right':
            temp[0] = cube.top[2]; temp[1] = cube.top[5]; temp[2] = cube.top[8];
            cube.top[2] = cube.front[2]; cube.top[5] = cube.front[5]; cube.top[8] = cube.front[8];
            cube.front[2] = cube.bottom[2]; cube.front[5] = cube.bottom[5]; cube.front[8] = cube.bottom[8];
            cube.bottom[2] = cube.back[6]; cube.bottom[5] = cube.back[3]; cube.bottom[8] = cube.back[0];
            cube.back[0] = temp[2]; cube.back[3] = temp[1]; cube.back[6] = temp[0];
            break;
    }
}

function scrambleCube() {
    const moves = ['front', 'top', 'right', 'back', 'left', 'bottom'];
    let count = 0;
    
    const interval = setInterval(() => {
        const face = moves[Math.floor(Math.random() * moves.length)];
        rotateFace(face);
        count++;
        
        if (count >= 10) {
            clearInterval(interval);
        }
    }, 250);
    
    sound.button();
}

function resetRubik() {
    initRubik();
    drawRubik();
    sound.button();
}

// 樣式
const rubikStyle = document.createElement('style');
rubikStyle.textContent = `
    .rubik-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; }
    .rubik-controls { display: flex; gap: 1rem; }
    .rubik-btn {
        background: var(--tertiary); border: 1px solid var(--card-border);
        color: var(--text); padding: 0.6rem 1.5rem; border-radius: 8px;
        font-size: 1rem; cursor: pointer; transition: transform 0.2s;
    }
    .rubik-btn:hover { background: var(--accent); border-color: var(--accent); transform: scale(1.05); }
    #rubikCanvas { border-radius: 12px; box-shadow: var(--glow); }
    .rubik-instructions { color: var(--text-dim); font-size: 0.9rem; }
`;
document.head.appendChild(rubikStyle);
window.initGame = initGame;
})();
