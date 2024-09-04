// components/Labyrinth.ts

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 480;
export const PLAYER_SIZE = 8;
export const WALL_COLOR = 'white';
export const PLAYER_COLOR = 'red';
export const BACKGROUND_COLOR = 'black';
export const TIME_LIMIT = 60; // 4 minutes

interface Player {
    x: number;
    y: number;
}

interface Cell {
    x: number;
    y: number;
}

export class Labyrinth {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private player: Player;
    private maze: number[][];
    private lastUpdateTime: number;
    public gameOver: boolean;
    public timeLeft: number;
    public win: boolean;
    public started: boolean;
    private cellSize: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.maze = this.generateMaze();
        this.cellSize = Math.floor(CANVAS_WIDTH / this.maze[0].length);
        this.player = { 
            x: this.cellSize * 1.5, 
            y: this.cellSize * 1.5 
        };
        this.gameOver = false;
        this.timeLeft = TIME_LIMIT;
        this.win = false;
        this.started = false;
        this.lastUpdateTime = Date.now();
    }

    private generateMaze(): number[][] {
        const width = 41; // Odd number to ensure walls on all sides
        const height = 31; // Odd number to ensure walls on all sides
        let maze: number[][] = Array(height).fill(null).map(() => Array(width).fill(1));

        const stack: Cell[] = [];
        const startX = 1;
        const startY = 1;
        maze[startY][startX] = 0;
        stack.push({ x: startX, y: startY });

        while (stack.length > 0) {
            const current = stack.pop()!;
            const neighbors = this.getUnvisitedNeighbors(current, maze, width, height);

            if (neighbors.length > 0) {
                stack.push(current);
                const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
                maze[chosen.y][chosen.x] = 0;
                maze[(current.y + chosen.y) / 2][(current.x + chosen.x) / 2] = 0; // Carve path
                stack.push(chosen);
            }
        }

        // Ensure the exit is reachable
        maze[height - 2][width - 2] = 0;
        maze[height - 1][width - 2] = 0; // Path to exit

        return maze;
    }

    private getUnvisitedNeighbors(cell: Cell, maze: number[][], width: number, height: number): Cell[] {
        const neighbors: Cell[] = [];
        const directions = [
            { dx: 0, dy: -2 },
            { dx: 2, dy: 0 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 }
        ];

        for (const dir of directions) {
            const newX = cell.x + dir.dx;
            const newY = cell.y + dir.dy;
            if (newX > 0 && newX < width - 1 && newY > 0 && newY < height - 1 && maze[newY][newX] === 1) {
                neighbors.push({ x: newX, y: newY });
            }
        }

        return neighbors;
    }

    public draw(): void {
        this.ctx.fillStyle = BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillStyle = WALL_COLOR;
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }

        // Draw exit
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect((this.maze[0].length - 2) * this.cellSize, (this.maze.length - 2) * this.cellSize, this.cellSize, this.cellSize);

        // Draw player
        this.ctx.fillStyle = PLAYER_COLOR;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Time left: ${Math.ceil(this.timeLeft)}`, 10, 30);

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

    public move(dx: number, dy: number): void {
        if (this.gameOver || !this.started) return;

        const speed = this.cellSize / 8; // Adjust speed to be a fraction of cell size
        const newX = this.player.x + dx * speed;
        const newY = this.player.y + dy * speed;

        const cellX = Math.floor(newX / this.cellSize);
        const cellY = Math.floor(newY / this.cellSize);

        if (cellX >= 0 && cellX < this.maze[0].length && cellY >= 0 && cellY < this.maze.length) {
            if (this.maze[cellY][cellX] === 0) {
                this.player.x = newX;
                this.player.y = newY;

                if (cellX === this.maze[0].length - 2 && cellY === this.maze.length - 2) {
                    this.win = true;
                    this.gameOver = true;
                }
            } else {
                // Wall collision: move player to the edge of the current cell
                const currentCellX = Math.floor(this.player.x / this.cellSize);
                const currentCellY = Math.floor(this.player.y / this.cellSize);
                
                if (currentCellX !== cellX) {
                    this.player.x = currentCellX * this.cellSize + (dx > 0 ? this.cellSize - PLAYER_SIZE/2 : PLAYER_SIZE/2);
                }
                if (currentCellY !== cellY) {
                    this.player.y = currentCellY * this.cellSize + (dy > 0 ? this.cellSize - PLAYER_SIZE/2 : PLAYER_SIZE/2);
                }
            }
        }
    }

    public update(): void {
        if (this.gameOver || !this.started) return;

        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        this.timeLeft -= elapsedSeconds;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.gameOver = true;
        }
    }

    public start(): void {
        this.started = true;
        this.lastUpdateTime = Date.now();
    }
}
