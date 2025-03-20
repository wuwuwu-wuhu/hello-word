class Snake {
    constructor() {
        this.body = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
    }

    move() {
        this.direction = this.nextDirection;
        const head = { ...this.body[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.body.unshift(head);
        this.body.pop();
    }

    grow() {
        const tail = { ...this.body[this.body.length - 1] };
        this.body.push(tail);
    }

    checkCollision(gridSize) {
        const head = this.body[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
            return true;
        }

        // 检查是否撞到自己
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }

        return false;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20; // 20x20的网格
        this.tileSize = this.canvas.width / this.gridSize;
        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.gameLoop = null;
        this.isGameOver = false;
        this.isPaused = false;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.speed = this.getSpeedByDifficulty('easy');
        this.specialFood = null;
        this.specialFoodTimer = null;
        this.soundManager = new SoundManager();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.bindTouchControls();

        this.bindControls();
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.speed = this.getSpeedByDifficulty(e.target.value);
            if (this.gameInterval) {
                this.resetGameInterval();
            }
        });

        document.getElementById('high-score-value').textContent = this.highScore;
    }

    generateFood(isSpecial = false) {
        const food = {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize),
            isSpecial: isSpecial
        };

        // 确保食物不会生成在蛇身上
        while (this.snake.body.some(segment => segment.x === food.x && segment.y === food.y)) {
            food.x = Math.floor(Math.random() * this.gridSize);
            food.y = Math.floor(Math.random() * this.gridSize);
        }

        return food;
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    if (this.snake.direction !== 'down') {
                        this.snake.nextDirection = 'up';
                        this.soundManager.playMove();
                    }
                    break;
                case 'ArrowDown':
                    if (this.snake.direction !== 'up') {
                        this.snake.nextDirection = 'down';
                        this.soundManager.playMove();
                    }
                    break;
                case 'ArrowLeft':
                    if (this.snake.direction !== 'right') {
                        this.snake.nextDirection = 'left';
                        this.soundManager.playMove();
                    }
                    break;
                case 'ArrowRight':
                    if (this.snake.direction !== 'left') {
                        this.snake.nextDirection = 'right';
                        this.soundManager.playMove();
                    }
                    break;
            }
        });
    }

    bindTouchControls() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0 && this.snake.direction !== 'left') {
                    this.snake.nextDirection = 'right';
                    this.soundManager.playMove();
                } else if (deltaX < 0 && this.snake.direction !== 'right') {
                    this.snake.nextDirection = 'left';
                    this.soundManager.playMove();
                }
            } else {
                if (deltaY > 0 && this.snake.direction !== 'up') {
                    this.snake.nextDirection = 'down';
                    this.soundManager.playMove();
                } else if (deltaY < 0 && this.snake.direction !== 'down') {
                    this.snake.nextDirection = 'up';
                    this.soundManager.playMove();
                }
            }
        });
    }

    update() {
        if (this.isGameOver || this.isPaused) return;

        this.snake.move();

        // 检查是否吃到食物
        if (this.snake.body[0].x === this.food.x && this.snake.body[0].y === this.food.y) {
            this.snake.grow();
            this.food = this.generateFood();
            this.score += this.food.isSpecial ? 20 : 10;
            document.getElementById('score-value').textContent = this.score;
            this.soundManager.playEat();

            // 有10%的概率生成特殊食物
            if (Math.random() < 0.1 && !this.specialFood) {
                this.specialFood = this.generateFood(true);
                // 特殊食物10秒后消失
                this.specialFoodTimer = setTimeout(() => {
                    this.specialFood = null;
                }, 10000);
            }
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('highScore', this.highScore);
                document.getElementById('high-score-value').textContent = this.highScore;
            }
        }

        // 检查碰撞
        if (this.snake.checkCollision(this.gridSize)) {
            this.gameOver();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        this.ctx.strokeStyle = '#e0e0e0';
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.canvas.width, i * this.tileSize);
            this.ctx.stroke();
        }

        // 绘制食物
        this.ctx.fillStyle = this.food.isSpecial ? '#ffd700' : '#ff0000';
        this.ctx.fillRect(
            this.food.x * this.tileSize,
            this.food.y * this.tileSize,
            this.tileSize,
            this.tileSize
        );

        if (this.specialFood) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillRect(
                this.specialFood.x * this.tileSize,
                this.specialFood.y * this.tileSize,
                this.tileSize,
                this.tileSize
            );
        }

        // 绘制蛇
        this.snake.body.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#2ecc71' : '#27ae60';
            this.ctx.fillRect(
                segment.x * this.tileSize,
                segment.y * this.tileSize,
                this.tileSize,
                this.tileSize
            );
        });

        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
    }

    getSpeedByDifficulty(difficulty) {
        switch (difficulty) {
            case 'easy': return 200;
            case 'medium': return 150;
            case 'hard': return 100;
            default: return 200;
        }
    }

    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pause-btn').textContent = this.isPaused ? '继续' : '暂停';
        
        if (this.isPaused) {
            clearInterval(this.gameInterval);
        } else {
            this.resetGameInterval();
        }
    }

    resetGameInterval() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }
        this.gameInterval = setInterval(() => {
            this.update();
            this.draw();
        }, this.speed);
    }

    startGame() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }
        if (this.specialFoodTimer) {
            clearTimeout(this.specialFoodTimer);
        }

        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        document.getElementById('score-value').textContent = '0';
        document.getElementById('pause-btn').textContent = '暂停';

        this.resetGameInterval();
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);
        this.soundManager.playGameOver();
    }
}

// 启动游戏
window.onload = () => {
    new Game();
};