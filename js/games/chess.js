/* ============================================
   象棋遊戲 (Chinese Chess)
   ============================================ */
let chessBoard = [];
let currentPlayer = 'red'; // red, black
let selectedPiece = null;
let moveHistory = [];
let canvasChess, ctxChess;
let cellSizeC, boardPaddingC = 40;
let pieceRadius;

const initialBoard = [
    ['車', '馬', '相', '仕', '將', '仕', '相', '馬', '車'],
    ['', '', '', '', '', '', '', '', ''],
    ['', '炮', '', '', '', '', '', '炮', ''],
    ['兵', '', '兵', '', '兵', '', '兵', '', '兵'],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['兵', '', '兵', '', '兵', '', '兵', '', '兵'],
    ['', '炮', '', '', '', '', '', '炮', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['車', '馬', '相', '仕', '將', '仕', '相', '馬', '車']
];

const pieceValues = {
    將: 100, 車: 90, 馬: 40, 炮: 45, 仕: 20, 相: 20, 兵: 10,
    帥: 100, 俥: 90, 傌: 40, 砲: 45, 士: 20, 象: 20, 卒: 10
};

function initGame(container) {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="chess-container">
            <div class="chess-info">
                <div class="chess-turn" id="chessTurn">紅方回合</div>
                <button class="chess-btn" onclick="resetChess()">🔄 重置</button>
            </div>
            <canvas id="chessCanvas"></canvas>
            <div class="chess-history" id="chessHistory"></div>
        </div>
    `;
    
    canvasChess = document.getElementById('chessCanvas');
    ctxChess = canvasChess.getContext('2d');
    
    resizeChessCanvas();
    window.addEventListener('resize', resizeChessCanvas);
    
    initChessBoard();
    drawChess();
    
    canvasChess.addEventListener('click', handleChessClick);
    canvasChess.addEventListener('touchstart', handleChessTouch, { passive: false });
}

function resizeChessCanvas() {
    const container = canvasChess.parentElement;
    const size = Math.min(container.clientWidth - 20, 500);
    canvasChess.width = size;
    canvasChess.height = size * 1.2;
    cellSizeC = (size - boardPaddingC * 2) / 8;
    pieceRadius = cellSizeC * 0.4;
    drawChess();
}

function initChessBoard() {
    chessBoard = JSON.parse(JSON.stringify(initialBoard));
    currentPlayer = 'red';
    selectedPiece = null;
    moveHistory = [];
    updateChessUI();
}

function drawChess() {
    if (!ctxMil || !chessBoard || !chessBoard.length) return;
    if (!ctxChess) return;
    
    // 背景
    ctxChess.fillStyle = '#1a1a2e';
    ctxChess.fillRect(0, 0, canvasChess.width, canvasChess.height);
    
    // 棋盤
    ctxChess.strokeStyle = '#8B4513';
    ctxChess.lineWidth = 2;
    ctxChess.fillStyle = '#DEB887';
    
    // 外框
    const boardX = boardPaddingC;
    const boardY = boardPaddingC;
    const boardW = cellSizeC * 8;
    const boardH = cellSizeC * 9;
    
    ctxChess.fillRect(boardX, boardY, boardW, boardH);
    ctxChess.strokeRect(boardX, boardY, boardW, boardH);
    
    // 豎線
    for (let i = 1; i < 9; i++) {
        ctxChess.beginPath();
        ctxChess.moveTo(boardX + i * cellSizeC, boardY);
        ctxChess.lineTo(boardX + i * cellSizeC, boardY + boardH);
        ctxChess.stroke();
    }
    
    // 橫線
    for (let i = 1; i < 9; i++) {
        ctxChess.beginPath();
        ctxChess.moveTo(boardX, boardY + i * cellSizeC);
        ctxChess.lineTo(boardX + boardW, boardY + i * cellSizeC);
        ctxChess.stroke();
    }
    
    // 楚河漢界
    ctxChess.fillStyle = '#1a1a2e';
    ctxChess.fillRect(boardX, boardY + cellSizeC * 4, boardW, cellSizeC);
    ctxChess.fillStyle = '#fff';
    ctxChess.font = `${cellSizeC * 0.4}px Arial`;
    ctxChess.textAlign = 'center';
    ctxChess.fillText('楚      河      漢      界', boardX + boardW/2, boardY + cellSizeC * 4.65);
    
    // 九宮斜線
    drawPalace(boardX + cellSizeC * 3, boardY, 'red');
    drawPalace(boardX + cellSizeC * 3, boardY + cellSizeC * 7, 'black');
    
    // 繪製棋子
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
            if (chessBoard[row][col]) {
                drawPiece(col, row, chessBoard[row][col]);
            }
        }
    }
    
    // 選中標記
    if (selectedPiece) {
        const { col, row } = selectedPiece;
        ctxChess.strokeStyle = '#00ff00';
        ctxChess.lineWidth = 3;
        ctxChess.strokeRect(
            boardPaddingC + col * cellSizeC - pieceRadius,
            boardPaddingC + row * cellSizeC - pieceRadius,
            pieceRadius * 2, pieceRadius * 2
        );
        
        // 顯示可走位置
        const moves = getValidMoves(col, row, chessBoard[row][col]);
        moves.forEach(m => {
            ctxChess.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctxChess.beginPath();
            ctxChess.arc(
                boardPaddingC + m.col * cellSizeC,
                boardPaddingC + m.row * cellSizeC,
                pieceRadius * 0.4, 0, Math.PI * 2
            );
            ctxChess.fill();
        });
    }
}

function drawPalace(x, y, palace) {
    ctxChess.strokeStyle = '#8B4513';
    ctxChess.lineWidth = 2;
    
    // 士的路
    ctxChess.beginPath();
    ctxChess.moveTo(x, y);
    ctxChess.lineTo(x + cellSizeC * 2, y + cellSizeC * 2);
    ctxChess.moveTo(x + cellSizeC * 2, y);
    ctxChess.lineTo(x, y + cellSizeC * 2);
    ctxChess.stroke();
}

function drawPiece(col, row, piece) {
    const x = boardPaddingC + col * cellSizeC;
    const y = boardPaddingC + row * cellSizeC;
    const isRed = piece === piece.toLowerCase() || '將帥車馬炮兵'.includes(piece);
    
    // 棋子圓
    const gradient = ctxChess.createRadialGradient(x - 5, y - 5, 0, x, y, pieceRadius);
    gradient.addColorStop(0, isRed ? '#ff6b6b' : '#4a4a4a');
    gradient.addColorStop(1, isRed ? '#c0392b' : '#1a1a1a');
    
    ctxChess.fillStyle = gradient;
    ctxChess.beginPath();
    ctxChess.arc(x, y, pieceRadius, 0, Math.PI * 2);
    ctxChess.fill();
    
    // 文字
    ctxChess.fillStyle = isRed ? '#fff' : '#fff';
    ctxChess.font = `bold ${pieceRadius * 0.9}px "Noto Sans TC", Arial`;
    ctxChess.textAlign = 'center';
    ctxChess.textBaseline = 'middle';
    ctxChess.fillText(piece, x, y);
}

function handleChessClick(e) {
    const rect = canvasChess.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.round((x - boardPaddingC) / cellSizeC);
    const row = Math.round((y - boardPaddingC) / cellSizeC);
    
    if (col < 0 || col > 8 || row < 0 || row > 9) return;
    
    selectPiece(col, row);
}

function handleChessTouch(e) {
    e.preventDefault();
    handleChessClick(e.touches[0]);
}

function selectPiece(col, row) {
    const piece = chessBoard[row][col];
    
    // 如果選中了自己的棋子
    if (piece && isCurrentPlayerPiece(piece)) {
        selectedPiece = { col, row };
        sound.click();
        drawChess();
        return;
    }
    
    // 如果已經選中棋子，嘗試移動
    if (selectedPiece) {
        const moves = getValidMoves(selectedPiece.col, selectedPiece.row, chessBoard[selectedPiece.row][selectedPiece.col]);
        const validMove = moves.find(m => m.col === col && m.row === row);
        
        if (validMove) {
            movePiece(selectedPiece.col, selectedPiece.row, col, row);
        } else {
            selectedPiece = null;
            drawChess();
        }
    }
}

function isCurrentPlayerPiece(piece) {
    const isRedPiece = '將帥車馬炮兵'.includes(piece);
    return (currentPlayer === 'red' && isRedPiece) || (currentPlayer === 'black' && !isRedPiece && piece !== '');
}

function getValidMoves(col, row, piece) {
    if (!piece) return [];
    
    const moves = [];
    const isRed = '將帥車馬炮兵'.includes(piece);
    
    // 根據棋子類型計算合法移動
    switch(piece) {
        case '車':
            moves.push(...getRookMoves(col, row, isRed));
            break;
        case '馬':
            moves.push(...getKnightMoves(col, row, isRed));
            break;
        case '炮':
            moves.push(...getCannonMoves(col, row, isRed));
            break;
        case '兵':
        case '卒':
            moves.push(...getPawnMoves(col, row, isRed));
            break;
        case '將':
        case '帥':
            moves.push(...getGeneralMoves(col, row, isRed));
            break;
        case '仕':
        case '士':
            moves.push(...getAdvisorMoves(col, row, isRed));
            break;
        case '相':
        case '象':
            moves.push(...getElephantMoves(col, row, isRed));
            break;
    }
    
    return moves.filter(m => isValidPosition(m.col, m.row, isRed));
}

function getRookMoves(col, row, isRed) {
    const moves = [];
    const directions = [[0,1], [0,-1], [1,0], [-1,0]];
    
    for (const [dx, dy] of directions) {
        for (let i = 1; i < 10; i++) {
            const newCol = col + dx * i;
            const newRow = row + dy * i;
            
            if (newCol < 0 || newCol > 8 || newRow < 0 || newRow > 9) break;
            
            if (chessBoard[newRow][newCol]) {
                if (!isCurrentPlayerPiece(chessBoard[newRow][newCol])) {
                    moves.push({ col: newCol, row: newRow });
                }
                break;
            }
            moves.push({ col: newCol, row: newRow });
        }
    }
    return moves;
}

function getKnightMoves(col, row, isRed) {
    const moves = [];
    const offsets = [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[-1,2],[1,-2],[1,2]];
    const legOffsets = {
        '-2,-1': [0,-1], '-2,1': [0,1], '2,-1': [0,-1], '2,1': [0,1],
        '-1,-2': [-1,0], '-1,2': [-1,0], '1,-2': [1,0], '1,2': [1,0]
    };
    
    for (const [dx, dy] of offsets) {
        const newCol = col + dx;
        const newRow = row + dy;
        const legKey = `${dx},${dy}`;
        const [lx, ly] = legOffsets[legKey];
        
        if (newCol >= 0 && newCol <= 8 && newRow >= 0 && newRow <= 9) {
            if (!chessBoard[row + ly][col + lx]) {
                if (!chessBoard[newRow][newCol] || !isCurrentPlayerPiece(chessBoard[newRow][newCol])) {
                    moves.push({ col: newCol, row: newRow });
                }
            }
        }
    }
    return moves;
}

function getCannonMoves(col, row, isRed) {
    const moves = [];
    const directions = [[0,1], [0,-1], [1,0], [-1,0]];
    
    for (const [dx, dy] of directions) {
        let passed = false;
        for (let i = 1; i < 10; i++) {
            const newCol = col + dx * i;
            const newRow = row + dy * i;
            
            if (newCol < 0 || newCol > 8 || newRow < 0 || newRow > 9) break;
            
            if (!passed) {
                if (chessBoard[newRow][newCol]) passed = true;
            } else {
                if (chessBoard[newRow][newCol]) {
                    if (!isCurrentPlayerPiece(chessBoard[newRow][newCol])) {
                        moves.push({ col: newCol, row: newRow });
                    }
                    break;
                }
            }
        }
    }
    return moves;
}

function getPawnMoves(col, row, isRed) {
    const moves = [];
    const forward = isRed ? -1 : 1;
    const crossed = isRed ? row <= 4 : row >= 5;
    
    // 前進
    if (row + forward >= 0 && row + forward <= 9) {
        if (!chessBoard[row + forward][col] || !isCurrentPlayerPiece(chessBoard[row + forward][col])) {
            moves.push({ col, row: row + forward });
        }
    }
    
    // 過河後可橫向
    if (crossed) {
        if (col - 1 >= 0 && (!chessBoard[row][col - 1] || !isCurrentPlayerPiece(chessBoard[row][col - 1]))) {
            moves.push({ col: col - 1, row });
        }
        if (col + 1 <= 8 && (!chessBoard[row][col + 1] || !isCurrentPlayerPiece(chessBoard[row][col + 1]))) {
            moves.push({ col: col + 1, row });
        }
    }
    return moves;
}

function getGeneralMoves(col, row, isRed) {
    const moves = [];
    const palaceMinRow = isRed ? 7 : 0;
    const palaceMaxRow = isRed ? 9 : 2;
    const palaceMinCol = 3;
    const palaceMaxCol = 5;
    
    const offsets = [[0,1], [0,-1], [1,0], [-1,0]];
    
    for (const [dx, dy] of offsets) {
        const newCol = col + dx;
        const newRow = row + dy;
        
        if (newCol >= palaceMinCol && newCol <= palaceMaxCol && newRow >= palaceMinRow && newRow <= palaceMaxRow) {
            if (!chessBoard[newRow][newCol] || !isCurrentPlayerPiece(chessBoard[newRow][newCol])) {
                moves.push({ col: newCol, row: newRow });
            }
        }
    }
    return moves;
}

function getAdvisorMoves(col, row, isRed) {
    const moves = [];
    const palaceMinRow = isRed ? 7 : 0;
    const palaceMaxRow = isRed ? 9 : 2;
    const palaceMinCol = 3;
    const palaceMaxCol = 5;
    
    const offsets = [[1,1], [1,-1], [-1,1], [-1,-1]];
    
    for (const [dx, dy] of offsets) {
        const newCol = col + dx;
        const newRow = row + dy;
        
        if (newCol >= palaceMinCol && newCol <= palaceMaxCol && newRow >= palaceMinRow && newRow <= palaceMaxRow) {
            if (!chessBoard[newRow][newCol] || !isCurrentPlayerPiece(chessBoard[newRow][newCol])) {
                moves.push({ col: newCol, row: newRow });
            }
        }
    }
    return moves;
}

function getElephantMoves(col, row, isRed) {
    const moves = [];
    const river = isRed ? 4 : 5;
    
    const offsets = [[2,2], [2,-2], [-2,2], [-2,-2]];
    const legOffsets = { '2,2': [1,1], '2,-2': [1,-1], '-2,2': [-1,1], '-2,-2': [-1,-1] };
    
    for (const [dx, dy] of offsets) {
        const newCol = col + dx;
        const newRow = row + dy;
        const legKey = `${dx},${dy}`;
        const [lx, ly] = legOffsets[legKey];
        
        if (newCol >= 0 && newCol <= 8 && newRow >= 0 && newRow <= 9) {
            // 不能過河
            if ((isRed && newRow > 4) || (!isRed && newRow < 5)) continue;
            
            // 塞象眼
            if (chessBoard[row + ly][col + lx]) continue;
            
            if (!chessBoard[newRow][newCol] || !isCurrentPlayerPiece(chessBoard[newRow][newCol])) {
                moves.push({ col: newCol, row: newRow });
            }
        }
    }
    return moves;
}

function isValidPosition(col, row, isRed) {
    if (col < 0 || col > 8 || row < 0 || row > 9) return false;
    return true;
}

function movePiece(fromCol, fromRow, toCol, toRow) {
    const piece = chessBoard[fromRow][fromCol];
    const captured = chessBoard[toRow][toCol];
    
    chessBoard[toRow][toCol] = piece;
    chessBoard[fromRow][fromCol] = '';
    
    moveHistory.push({ from: { col: fromCol, row: fromRow }, to: { col: toCol, row: toRow }, piece, captured });
    
    selectedPiece = null;
    currentPlayer = currentPlayer === 'red' ? 'black' : 'red';
    
    updateChessUI();
    drawChess();
    sound.move();
}

function updateChessUI() {
    const turnEl = document.getElementById('chessTurn');
    turnEl.textContent = currentPlayer === 'red' ? '🔴 紅方回合' : '⚫ 黑方回合';
    turnEl.style.color = currentPlayer === 'red' ? '#ff4444' : '#fff';
}

function resetChess() {
    initChessBoard();
    drawChess();
    sound.button();
}

// 樣式
const chessStyle = document.createElement('style');
chessStyle.textContent = `
    .chess-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; }
    .chess-info { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 450px; }
    .chess-turn { font-size: 1.3rem; font-weight: bold; }
    .chess-btn { background: var(--tertiary); border: 1px solid var(--card-border); color: var(--text); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
    .chess-btn:hover { background: var(--accent); border-color: var(--accent); }
    #chessCanvas { border-radius: 8px; box-shadow: var(--glow); }
    .chess-history { font-size: 0.8rem; color: var(--text-dim); max-height: 60px; overflow-y: auto; }
`;
document.head.appendChild(chessStyle);
