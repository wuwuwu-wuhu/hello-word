// 音效管理类
class SoundManager {
    constructor() {
        this.moveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        this.eatSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
        this.gameOverSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

        // 设置音量
        this.moveSound.volume = 0.3;
        this.eatSound.volume = 0.5;
        this.gameOverSound.volume = 0.7;

        // 预加载音效
        this.preloadSounds();
    }

    preloadSounds() {
        this.moveSound.load();
        this.eatSound.load();
        this.gameOverSound.load();
    }

    playMove() {
        this.moveSound.currentTime = 0;
        this.moveSound.play().catch(e => console.log('音效播放失败:', e));
    }

    playEat() {
        this.eatSound.currentTime = 0;
        this.eatSound.play().catch(e => console.log('音效播放失败:', e));
    }

    playGameOver() {
        this.gameOverSound.currentTime = 0;
        this.gameOverSound.play().catch(e => console.log('音效播放失败:', e));
    }
}