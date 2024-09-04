const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const PLAYER_SIZE = 10;
const WALL_COLOR = 'white';
const PLAYER_COLOR = 'red';
const BACKGROUND_COLOR = 'black';
const TIME_LIMIT = 120; // 2 minutes in seconds

class Labyrinth {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.player = { x: 20, y: 20 }; // Starting position of the player
        this.maze = this.generateMaze();
        this.gameOver = false;
        this.timeLeft = TIME_LIMIT;
        this.win = false;
        this.started = false;
    }

    generateMaze() {
        const width = 32; // Number of cells in width
        const height = 24; // Number of cells in height
        let maze = Array(height).fill().map(() => Array(width).fill(1));

        // Simple maze generation logic (for demonstration)
        for (let y = 1; y < height - 1; y += 2) {
            for (let x = 1; x < width - 1; x += 2) {
                maze[y][x] = 0; // Create a path
                if (Math.random() > 0.5) {
                    maze[y][x + 1] = 0; // Create a path to the right
                } else {
                    maze[y + 1][x] = 0; // Create a path down
                }
            }
        }

        // Ensure the exit point (bottom-right corner) is a path
        maze[height - 2][width - 2] = 0; // Exit path
        maze[height - 1][width - 2] = 0; // Path to the exit
        maze[height - 2][width - 1] = 0; // Path to the exit

        return maze;
    }

    draw() {
        this.ctx.fillStyle = BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const cellSize = CANVAS_WIDTH / this.maze[0].length; // Calculate cell size based on canvas width

        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillStyle = WALL_COLOR;
                    this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize); // Use cellSize for walls
                }
                // Draw the exit point
                if (y === this.maze.length - 2 && x === this.maze[0].length - 2) {
                    this.ctx.fillStyle = 'green'; // Color for the exit
                    this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize); // Draw exit
                }
            }
        }

        this.ctx.fillStyle = PLAYER_COLOR;
        this.ctx.fillRect(this.player.x, this.player.y, PLAYER_SIZE, PLAYER_SIZE);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Time left: ${this.timeLeft}`, 10, 30);

        if (!this.started) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Arial';
            this.ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Use arrow keys to move', CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2 + 40);
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Arial';
            this.ctx.fillText(this.win ? 'You Win!' : 'Game Over!', CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2 + 40);
        }
    }

    move(dx, dy) {
        if (this.gameOver || !this.started) return;

        let newX = this.player.x + dx;
        let newY = this.player.y + dy;

        let cellSize = CANVAS_WIDTH / this.maze[0].length; // Calculate cell size
        let cellX = Math.floor(newX / cellSize);
        let cellY = Math.floor(newY / cellSize);

        if (this.maze[cellY][cellX] === 0) {
            this.player.x = newX;
            this.player.y = newY;

            // Check for exit condition
            if (cellX === this.maze[0].length - 2 && cellY === this.maze.length - 2) {
                this.win = true;
                this.gameOver = true;
            }
        }
    }

    update() {
        if (this.gameOver || !this.started) return;

        this.timeLeft--;
        if (this.timeLeft <= 0) {
            this.gameOver = true;
        }
    }

    start() {
        this.started = true;
    }
}

let game;
let intervalId;

function startGame() {
    const canvas = document.getElementById('gameCanvas');
    game = new Labyrinth(canvas);
    game.draw();

    intervalId = setInterval(() => {
        game.update();
        game.draw();
        if (game.gameOver) {
            clearInterval(intervalId);
            if (game.win) {
                alert('You win!');
                // Call smart contract to pay out winnings
            } else {
                alert('Game over!');
            }
        }
    }, 1000);
}

document.addEventListener('keydown', (event) => {
    if (!game) return;

    if (event.code === 'Space' && !game.started) {
        game.start();
        return;
    }

    if (game.gameOver && event.code === 'KeyR') {
        game = new Labyrinth(document.getElementById('gameCanvas')); // Restart the game
        return;
    }

    switch(event.key) {
        case 'ArrowUp':
            game.move(0, -5);
            break;
        case 'ArrowDown':
            game.move(0, 5);
            break;
        case 'ArrowLeft':
            game.move(-5, 0);
            break;
        case 'ArrowRight':
            game.move(5, 0);
            break;
    }
});

// Start the game when the page loads
window.onload = startGame;
