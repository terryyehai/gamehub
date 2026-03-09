/* ============================================
   Sound Manager - 音效管理器
   ============================================ */
class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.context = null;
        this.sounds = {};
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) this.init();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // 生成音效
    playTone(frequency, duration = 0.1, type = 'sine', volume = null) {
        if (!this.enabled || !this.context) return;
        
        const vol = volume !== null ? volume : this.volume;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
            
            gainNode.gain.setValueAtTime(vol * 0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        } catch (e) {
            // 忽略音效錯誤
        }
    }

    // 點擊音效
    click() {
        this.playTone(800, 0.05, 'sine');
    }

    // 成功音效
    success() {
        this.playTone(523, 0.1, 'sine');
        setTimeout(() => this.playTone(659, 0.1, 'sine'), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine'), 200);
    }

    // 失敗音效
    fail() {
        this.playTone(200, 0.2, 'sawtooth');
    }

    // 遊戲音效
    gameStart() {
        this.playTone(440, 0.1);
        setTimeout(() => this.playTone(554, 0.1), 100);
        setTimeout(() => this.playTone(659, 0.1), 200);
    }

    // 棋子聲
    move() {
        this.playTone(600, 0.08, 'sine', 0.3);
    }

    // 吃子
    capture() {
        this.playTone(300, 0.15, 'square', 0.2);
    }

    // 獲勝
    win() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.2), i * 150);
        });
    }

    // 失敗
    lose() {
        const notes = [400, 350, 300, 250];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.25), i * 200);
        });
    }

    // 計時器
    tick() {
        this.playTone(1000, 0.03, 'sine', 0.1);
    }

    // 按鈕
    button() {
        this.playTone(440, 0.05, 'sine');
    }

    // 錯誤
    error() {
        this.playTone(150, 0.3, 'sawtooth', 0.3);
    }

    // 菜單
    menu() {
        this.playTone(300, 0.05);
        setTimeout(() => this.playTone(400, 0.05), 50);
    }

    // 翻牌
    flip() {
        this.playTone(500, 0.05, 'triangle');
    }

    // 發牌
    deal() {
        this.playTone(200, 0.05, 'sine', 0.2);
    }
}

// 全域音效管理器
const sound = new SoundManager();
