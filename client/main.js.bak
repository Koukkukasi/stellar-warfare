import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

class StellarWarfare {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas to full screen
        this.resizeCanvas();
        this.resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);

        // Initialize game systems
        this.game = new Game();
        this.renderer = new Renderer(this.ctx, this.canvas);
        this.inputHandler = new InputHandler(this.canvas, this.game);

        // FPS tracking
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();

        // Game loop
        this.lastTime = performance.now();
        this.targetFPS = 60;
        this.targetFrameTime = 1000 / this.targetFPS;

        // CRASH PREVENTION: Track animation frame for cleanup
        this.animationFrameId = null;
        this.isRunning = false;

        // CRASH PREVENTION: Auto-cleanup on page unload
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // Start game
        this.start();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.renderer) {
            this.renderer.updateCanvasSize(this.canvas);
        }
    }

    start() {
        // Connect to server
        this.game.connect('http://localhost:3000');

        // CRASH PREVENTION: Set running flag to true
        this.isRunning = true;

        // Start game loop
        this.gameLoop();
    }

    gameLoop() {
        // CRASH PREVENTION: Don't run loop if not running
        if (!this.isRunning) {
            console.log('[Client] Game loop stopped');
            return;
        }

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Update game state
        this.game.update(deltaTime);

        // Render
        this.renderer.render(this.game.getState());

        // Update UI
        this.updateUI(deltaTime);

        // Calculate FPS
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }

        // CRASH PREVENTION: Store animation frame ID for cleanup
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    // CRASH PREVENTION: Handle page visibility changes
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('[Client] Tab hidden, pausing game loop');
            this.isRunning = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        } else {
            console.log('[Client] Tab visible, resuming game loop');
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    // CRASH PREVENTION: Cleanup resources
    cleanup() {
        console.log('[Client] Cleaning up resources');
        this.isRunning = false;

        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Remove event listeners
        window.removeEventListener('resize', this.resizeHandler);

        // Disconnect from server
        if (this.game && this.game.socket) {
            this.game.socket.disconnect();
        }

        console.log('[Client] Cleanup complete');
    }

    updateUI(deltaTime) {
        const state = this.game.getState();
        const player = state.player;

        // Update FPS
        document.getElementById('fps').textContent = `FPS: ${this.fps}`;

        // Update player info
        if (player) {
            document.getElementById('position').textContent =
                `Position: (${Math.round(player.x)}, ${Math.round(player.y)})`;
            document.getElementById('velocity').textContent =
                `Velocity: (${player.vx.toFixed(2)}, ${player.vy.toFixed(2)})`;
            document.getElementById('shipType').textContent =
                `Ship: ${player.shipType || 'None'}`;
        }

        // Update connection status
        const statusEl = document.getElementById('connectionStatus');
        if (this.game.isConnected()) {
            statusEl.textContent = 'Connected';
            statusEl.className = 'connected';
        } else {
            statusEl.textContent = 'Disconnected';
            statusEl.className = 'disconnected';
        }
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new StellarWarfare();
    });
} else {
    new StellarWarfare();
}
