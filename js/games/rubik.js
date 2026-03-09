(function() {
/* ============================================
   魔術方塊遊戲 (Rubik's Cube)
   完整 3x3x3 還原遊戲
   ============================================ */

let cube = {
    U: [], D: [], F: [], B: [], L: [], R: []
};

const colors = {
    U: '#ffffff', D: '#ffff00', F: '#ff4444', 
    B: '#ff8800', L: '#00aa00', R: '#0066ff'
};

let moveCount = 0;
let startTime = 0;

function cleanup() {}

function initGame(container) {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <div class="rubik-container">
            <div class="rubik-info">
                <div class="rubik-moves">步數: <span id="rubikMoves">0</span></div>
                <div class="rubik-timer">時間: <span id="rubikTimer">0:00</span></div>
            </div>
            <div class="rubik-controls">
                <button class="rubik-btn" onclick="scrambleRubik()">🔀 洗亂</button>
                <button class="rubik-btn" onclick="resetRubik()">🔄 重置</button>
            </div>
            <div class="rubik-canvas-wrapper">
                <canvas id="rubikCanvas"></canvas>
            </div>
            <div class="rubik-buttons">
                <button class="rb-btn" onclick="rotateLayer('U')">U 上</button>
                <button class="rb-btn" onclick="rotateLayer('D')">D 下</button>
                <button class="rb-btn" onclick="rotateLayer('F')">F 前</button>
                <button class="rb-btn" onclick="rotateLayer('B')">B 後</button>
                <button class="rb-btn" onclick="rotateLayer('L')">L 左</button>
                <button class="rb-btn" onclick="rotateLayer('R')">R 右</button>
            </div>
            <p class="rubik-hint">點擊按鈕旋轉面 | 目標：還原六面</p>
        </div>
    `;
    initRubik();
    startTimer();
}

function initRubik() {
    for (let face in cube) cube[face] = Array(9).fill(colors[face]);
    moveCount = 0;
    updateRubikUI();
    drawRubik();
}

function startTimer() {
    startTime = Date.now();
    if (window.rubikTimer) clearInterval(window.rubikTimer);
    window.rubikTimer = setInterval(updateRubikTimer, 1000);
}

function updateRubikTimer() {
    if (!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    document.getElementById('rubikTimer').textContent = min + ':' + sec.toString().padStart(2, '0');
}

function updateRubikUI() {
    document.getElementById('rubikMoves').textContent = moveCount;
}

function rotateLayer(layer, clockwise = true) {
    cube[layer] = rotateFace(cube[layer], clockwise);
    rotateEdges(layer, clockwise);
    moveCount++;
    updateRubikUI();
    drawRubik();
    sound.move();
    setTimeout(checkSolved, 100);
}

function rotateFace(face, cw) {
    const f = [...face];
    if (cw) {
        return [f[6], f[3], f[0], f[7], f[4], f[1], f[8], f[5], f[2]];
    }
    return [f[2], f[5], f[8], f[1], f[4], f[7], f[0], f[3], f[6]];
}

function rotateEdges(layer, cw) {
    let t;
    switch(layer) {
        case 'U':
            if (cw) { t = [cube.F[0],cube.F[1],cube.F[2]]; [cube.F[0],cube.F[1],cube.F[2]] = [cube.R[0],cube.R[1],cube.R[2]]; [cube.R[0],cube.R[1],cube.R[2]] = [cube.B[0],cube.B[1],cube.B[2]]; [cube.B[0],cube.B[1],cube.B[2]] = [cube.L[0],cube.L[1],cube.L[2]]; [cube.L[0],cube.L[1],cube.L[2]] = t; }
            else { t = [cube.F[0],cube.F[1],cube.F[2]]; [cube.F[0],cube.F[1],cube.F[2]] = [cube.L[0],cube.L[1],cube.L[2]]; [cube.L[0],cube.L[1],cube.L[2]] = [cube.B[0],cube.B[1],cube.B[2]]; [cube.B[0],cube.B[1],cube.B[2]] = [cube.R[0],cube.R[1],cube.R[2]]; [cube.R[0],cube.R[1],cube.R[2]] = t; }
            break;
        case 'D':
            if (cw) { t = [cube.F[6],cube.F[7],cube.F[8]]; [cube.F[6],cube.F[7],cube.F[8]] = [cube.L[6],cube.L[7],cube.L[8]]; [cube.L[6],cube.L[7],cube.L[8]] = [cube.B[6],cube.B[7],cube.B[8]]; [cube.B[6],cube.B[7],cube.B[8]] = [cube.R[6],cube.R[7],cube.R[8]]; [cube.R[6],cube.R[7],cube.R[8]] = t; }
            else { t = [cube.F[6],cube.F[7],cube.F[8]]; [cube.F[6],cube.F[7],cube.F[8]] = [cube.R[6],cube.R[7],cube.R[8]]; [cube.R[6],cube.R[7],cube.R[8]] = [cube.B[6],cube.B[7],cube.B[8]]; [cube.B[6],cube.B[7],cube.B[8]] = [cube.L[6],cube.L[7],cube.L[8]]; [cube.L[6],cube.L[7],cube.L[8]] = t; }
            break;
        case 'F':
            if (cw) { t = [cube.U[6],cube.U[7],cube.U[8]]; [cube.U[6],cube.U[7],cube.U[8]] = [cube.L[8],cube.L[5],cube.L[2]]; [cube.L[2],cube.L[5],cube.L[8]] = [cube.D[0],cube.D[1],cube.D[2]]; [cube.D[0],cube.D[1],cube.D[2]] = [cube.R[6],cube.R[3],cube.R[0]]; [cube.R[0],cube.R[3],cube.R[6]] = t; }
            else { t = [cube.U[6],cube.U[7],cube.U[8]]; [cube.U[6],cube.U[7],cube.U[8]] = [cube.R[0],cube.R[3],cube.R[6]]; [cube.R[0],cube.R[3],cube.R[6]] = [cube.D[2],cube.D[1],cube.D[0]]; [cube.D[0],cube.D[1],cube.D[2]] = [cube.L[2],cube.L[5],cube.L[8]]; [cube.L[2],cube.L[5],cube.L[8]] = [t[2],t[1],t[0]]; }
            break;
        case 'B':
            if (cw) { t = [cube.U[0],cube.U[1],cube.U[2]]; [cube.U[0],cube.U[1],cube.U[2]] = [cube.R[2],cube.R[5],cube.R[8]]; [cube.R[2],cube.R[5],cube.R[8]] = [cube.D[8],cube.D[7],cube.D[6]]; [cube.D[6],cube.D[7],cube.D[8]] = [cube.L[0],cube.L[3],cube.L[6]]; [cube.L[0],cube.L[3],cube.L[6]] = [t[2],t[1],t[0]]; }
            else { t = [cube.U[0],cube.U[1],cube.U[2]]; [cube.U[0],cube.U[1],cube.U[2]] = [cube.L[6],cube.L[3],cube.L[0]]; [cube.L[0],cube.L[3],cube.L[6]] = [cube.D[6],cube.D[7],cube.D[8]]; [cube.D[6],cube.D[7],cube.D[8]] = [cube.R[8],cube.R[5],cube.R[2]]; [cube.R[2],cube.R[5],cube.R[8]] = t; }
            break;
        case 'L':
            if (cw) { t = [cube.U[0],cube.U[3],cube.U[6]]; [cube.U[0],cube.U[3],cube.U[6]] = [cube.B[8],cube.B[5],cube.B[2]]; [cube.B[2],cube.B[5],cube.B[8]] = [cube.D[6],cube.D[3],cube.D[0]]; [cube.D[0],cube.D[3],cube.D[6]] = [cube.F[0],cube.F[3],cube.F[6]]; [cube.F[0],cube.F[3],cube.F[6]] = t; }
            else { t = [cube.U[0],cube.U[3],cube.U[6]]; [cube.U[0],cube.U[3],cube.U[6]] = [cube.F[0],cube.F[3],cube.F[6]]; [cube.F[0],cube.F[3],cube.F[6]] = [cube.D[0],cube.D[3],cube.D[6]]; [cube.D[0],cube.D[3],cube.D[6]] = [cube.B[8],cube.B[5],cube.B[2]]; [cube.B[2],cube.B[5],cube.B[8]] = [t[2],t[1],t[0]]; }
            break;
        case 'R':
            if (cw) { t = [cube.U[2],cube.U[5],cube.U[8]]; [cube.U[2],cube.U[5],cube.U[8]] = [cube.F[2],cube.F[5],cube.F[8]]; [cube.F[2],cube.F[5],cube.F[8]] = [cube.D[2],cube.D[5],cube.D[8]]; [cube.D[2],cube.D[5],cube.D[8]] = [cube.B[6],cube.B[3],cube.B[0]]; [cube.B[0],cube.B[3],cube.B[6]] = [t[2],t[1],t[0]]; }
            else { t = [cube.U[2],cube.U[5],cube.U[8]]; [cube.U[2],cube.U[5],cube.U[8]] = [cube.B[6],cube.B[3],cube.B[0]]; [cube.B[0],cube.B[3],cube.B[6]] = [cube.D[8],cube.D[5],cube.D[2]]; [cube.D[2],cube.D[5],cube.D[8]] = [cube.F[2],cube.F[5],cube.F[8]]; [cube.F[2],cube.F[5],cube.F[8]] = t; }
            break;
    }
}

function checkSolved() {
    for (let face in cube) {
        const c = cube[face][0];
        for (let i = 1; i < 9; i++) if (cube[face][i] !== c) return false;
    }
    clearInterval(window.rubikTimer);
    setTimeout(() => { try { alert('🎉 恭喜還原！步數: ' + moveCount); } catch(e) {} sound.win(); }, 100);
    return true;
}

function scrambleRubik() {
    const layers = ['U','D','F','B','L','R'];
    initRubik();
    startTime = Date.now();
    for (let i = 0; i < 20; i++) {
        const layer = layers[Math.floor(Math.random() * 6)];
        const cw = Math.random() > 0.5;
        cube[layer] = rotateFace(cube[layer], cw);
        rotateEdges(layer, cw);
    }
    moveCount = 0;
    updateRubikUI();
    drawRubik();
    sound.button();
}

function resetRubik() { initRubik(); startTimer(); sound.button(); }

function drawRubik() {
    const canvas = document.getElementById('rubikCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);
    const cs = size / 7;
    drawFace(ctx, 'F', cs * 2.5, cs * 3.5, cs);
    drawFace(ctx, 'U', cs * 2.5, cs * 0.5, cs);
    drawFace(ctx, 'R', cs * 4.5, cs * 3.5, cs);
    drawFace(ctx, 'D', cs * 2.5, cs * 5.5, cs);
}

function drawFace(ctx, face, x, y, size) {
    const cs = size / 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const color = cube[face][r * 3 + c];
            ctx.fillStyle = color;
            ctx.fillRect(x + c * cs + 1, y + r * cs + 1, cs - 2, cs - 2);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + c * cs, y + r * cs, cs, cs);
        }
    }
}

const rubikStyle = document.createElement('style');
rubikStyle.textContent = `
    .rubik-container { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.5rem; width: 100%; }
    .rubik-info { display: flex; gap: 2rem; font-size: 1rem; }
    .rubik-moves { color: var(--accent); }
    .rubik-timer { color: var(--accent2); }
    .rubik-controls { display: flex; gap: 0.5rem; }
    .rubik-btn { background: var(--tertiary); border: 1px solid var(--card-border); color: var(--text); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
    .rubik-btn:hover { background: var(--accent); }
    .rubik-canvas-wrapper { padding: 0.5rem; }
    #rubikCanvas { max-width: 100%; height: auto; border-radius: 8px; }
    .rubik-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.3rem; width: 100%; max-width: 250px; }
    .rb-btn { background: var(--tertiary); border: 1px solid var(--card-border); color: var(--text); padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
    .rb-btn:hover { background: var(--accent); }
    .rubik-hint { color: var(--text-dim); font-size: 0.8rem; }
`;
document.head.appendChild(rubikStyle);

window.initGame = initGame;
window.cleanup = cleanup;
window.rotateLayer = rotateLayer;
window.scrambleRubik = scrambleRubik;
window.resetRubik = resetRubik;
})();
