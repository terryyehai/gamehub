/* ============================================
   GameHub - 主程式
   ============================================ */

// 遊戲列表
const games = {
    gomoku: {
        name: '五子棋',
        icon: '⭕',
        file: 'js/games/gomoku.js'
    },
    chess: {
        name: '象棋',
        icon: '🎲',
        file: 'js/games/chess.js'
    },
    darkchess: {
        name: '暗棋',
        icon: '🌑',
        file: 'js/games/darkchess.js'
    },
    military: {
        name: '軍棋',
        icon: '⚔️',
        file: 'js/games/military.js'
    },
    rubik: {
        name: '魔術方塊',
        icon: '🧊',
        file: 'js/games/rubik.js'
    },
    snake: {
        name: '貪食蛇',
        icon: '🐍',
        file: 'js/games/snake.js'
    },
    minesweeper: {
        name: '踩地雷',
        icon: '💣',
        file: 'js/games/minesweeper.js'
    },
    pinball: {
        name: '彈珠台',
        icon: '🔵',
        file: 'js/games/pinball.js'
    },
    solitaire: {
        name: '接龍',
        icon: '🃏',
        file: 'js/games/solitaire.js'
    },
    bigtwo: {
        name: '大老二',
        icon: '🃗',
        file: 'js/games/bigtwo.js'
    }
};

// 目前載入的遊戲
let currentGame = null;

// 頁面載入完成
document.addEventListener('DOMContentLoaded', init);

function init() {
    // 初始化導航
    initNav();
    
    // 初始化載入畫面
    initLoader();
    
    // 初始化設定
    initSettings();
    
    // 監聽鍵盤
    initKeyboard();
}

function initNav() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    navToggle?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        sound.menu();
    });

    // 點擊連結關閉選單
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // 音效切換
    const soundToggle = document.getElementById('soundToggle');
    soundToggle?.addEventListener('click', () => {
        soundToggle.classList.toggle('muted');
        sound.setEnabled(!soundToggle.classList.contains('muted'));
    });
}

function initLoader() {
    const loader = document.getElementById('loader');
    
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 2000);
}

function initSettings() {
    // 從 localStorage 讀取設定
    const soundEnabled = localStorage.getItem('soundEnabled');
    if (soundEnabled !== null) {
        const enabled = soundEnabled === 'true';
        sound.setEnabled(enabled);
        
        const soundToggle = document.getElementById('soundToggle');
        const soundSetting = document.getElementById('soundSetting');
        
        if (!enabled) soundToggle?.classList.add('muted');
        if (soundSetting) soundSetting.checked = enabled;
    }
}

function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        // ESC 關閉遊戲
        if (e.key === 'Escape') {
            if (document.getElementById('gameContainer')?.classList.contains('active')) {
                closeGame();
            }
            closeModal();
        }
    });
}

// 載入遊戲
function loadGame(gameId) {
    const game = games[gameId];
    if (!game) return;
    
    sound.init();
    sound.button();
    
    const container = document.getElementById('gameContainer');
    const title = document.getElementById('gameTitle');
    const content = document.getElementById('gameContent');
    
    title.textContent = `${game.icon} ${game.name}`;
    container.classList.add('active');
    
    // 動畫
    content.style.opacity = '0';
    
    // 動態載入遊戲腳本
    const script = document.createElement('script');
    script.src = game.file;
    script.onload = () => {
        // 遊戲腳本載入完成
        if (typeof initGame === 'function') {
            initGame(content);
            currentGame = { id: gameId, close: typeof closeGame === 'function' ? closeGame : null };
        }
        
        // 淡入動畫
        setTimeout(() => {
            content.style.transition = 'opacity 0.3s';
            content.style.opacity = '1';
        }, 50);
        
        sound.gameStart();
    };
    script.onerror = () => {
        content.innerHTML = `<div style="text-align:center;padding:2rem;">
            <p>遊戲載入失敗</p>
            <button onclick="closeGame()" class="game-btn">返回</button>
        </div>`;
    };
    document.body.appendChild(script);
}

// 關閉遊戲
function closeGame() {
    const container = document.getElementById('gameContainer');
    const content = document.getElementById('gameContent');
    
    // 清理遊戲
    if (currentGame?.cleanup && typeof currentGame.cleanup === 'function') {
        currentGame.cleanup();
    }
    currentGame = null;
    
    // 清空內容
    content.innerHTML = '';
    
    // 移除遊戲腳本
    const scripts = document.querySelectorAll('#gameContent script');
    scripts.forEach(s => s.remove());
    
    container.classList.remove('active');
    sound.click();
}

// 遊戲控制
function gameRestart() {
    sound.button();
    if (typeof restartGame === 'function') {
        restartGame();
    }
}

function gameHelp() {
    sound.button();
    showHelp();
}

// 顯示說明
function showHelp(gameId) {
    const helpContent = document.getElementById('helpContent');
    const modal = document.getElementById('helpModal');
    
    if (typeof getGameHelp === 'function') {
        helpContent.innerHTML = getGameHelp();
    } else {
        helpContent.innerHTML = '<p>此遊戲暫無說明</p>';
    }
    
    modal.classList.add('active');
    sound.click();
}

// 關閉 Modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    sound.click();
}

// 切換音效
function toggleSound(enabled) {
    sound.setEnabled(enabled);
    localStorage.setItem('soundEnabled', enabled);
    
    if (enabled) {
        sound.init();
        sound.button();
    }
}

// 震動回饋 (手機)
function vibrate(duration = 10) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// 顯示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--${type === 'error' ? 'accent2' : 'accent'});
        color: white;
        padding: 1rem 2rem;
        border-radius: var(--radius-md);
        z-index: 1000;
        animation: fadeIn 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// 導航平滑滾動
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
