import { Game } from './game-interpolated.js';
import { Renderer } from './renderer-smooth.js';
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

        // FPS and performance tracking
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.frameTimeHistory = [];
        this.maxFrameTimeHistory = 60;

        // Game loop with improved timing
        this.lastTime = performance.now();
        this.targetFPS = 60;
        this.targetFrameTime = 1000 / this.targetFPS;
        this.accumulator = 0;
        this.maxDeltaTime = 1 / 15; // Cap at 15 FPS minimum

        // CRASH PREVENTION: Track animation frame for cleanup
        this.animationFrameId = null;
        this.isRunning = false;

        // CRASH PREVENTION: Auto-cleanup on page unload
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // Debug controls
        this.setupDebugControls();

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

    setupDebugControls() {
        // Add keyboard shortcuts for debug features
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'F1':
                    e.preventDefault();
                    this.renderer.toggleInterpolationDebug();
                    break;
                case 'F2':
                    e.preventDefault();
                    this.renderer.toggleVelocityVectors();
                    break;
                case 'F3':
                    e.preventDefault();
                    this.renderer.toggleMotionBlur();
                    break;
                case 'F4':
                    e.preventDefault();
                    this.toggleSmoothingPreset();
                    break;
            }
        });
    }

    toggleSmoothingPreset() {
        // Cycle through different smoothing presets
        if (!this.smoothingPreset) this.smoothingPreset = 0;
        this.smoothingPreset = (this.smoothingPreset + 1) % 4;

        switch(this.smoothingPreset) {
            case 0: // Default
                this.renderer.setCameraSmoothing(0.1, 0.1);
                console.log('[Smoothing] Default (0.1, 0.1)');
                break;
            case 1: // Smooth
                this.renderer.setCameraSmoothing(0.05, 0.05);
                console.log('[Smoothing] Smooth (0.05, 0.05)');
                break;
            case 2: // Responsive
                this.renderer.setCameraSmoothing(0.2, 0.15);
                console.log('[Smoothing] Responsive (0.2, 0.15)');
                break;
            case 3: // Instant
                this.renderer.setCameraSmoothing(1, 0.5);
                console.log('[Smoothing] Instant (1, 0.5)');
                break;
        }
    }

    start() {
        // Connect to server
        this.game.connect('http://localhost:3000');

        // CRASH PREVENTION: Set running flag to true
        this.isRunning = true;

        // Start game loop with improved timing
        this.gameLoop();
    }

    gameLoop() {
        // CRASH PREVENTION: Don't run loop if not running
        if (!this.isRunning) {
            console.log('[Client] Game loop stopped');
            return;
        }

        const currentTime = performance.now();
        let frameTime = (currentTime - this.lastTime) / 1000; // Convert to seconds

        // Cap frame time to prevent spiral of death
        frameTime = Math.min(frameTime, this.maxDeltaTime);

        this.lastTime = currentTime;

        // Track frame time for performance monitoring
        this.frameTimeHistory.push(frameTime * 1000);
        if (this.frameTimeHistory.length > this.maxFrameTimeHistory) {
            this.frameTimeHistory.shift();
        }

        // Fixed timestep with interpolation for physics
        this.accumulator += frameTime;

        const fixedDeltaTime = 1 / 60; // 60 Hz physics
        let physicsUpdates = 0;
        const maxPhysicsUpdates = 5; // Prevent spiral of death

        while (this.accumulator >= fixedDeltaTime && physicsUpdates < maxPhysicsUpdates) {
            // Update game state with fixed timestep
            this.game.update(fixedDeltaTime);
            this.accumulator -= fixedDeltaTime;
            physicsUpdates++;
        }

        // Interpolation alpha for rendering
        const alpha = this.accumulator / fixedDeltaTime;

        // Get interpolation stats
        const interpolationStats = this.game.getInterpolationStats();

        // Render with interpolation
        this.renderer.render(this.game.getState(), frameTime, interpolationStats);

        // Update UI
        this.updateUI(frameTime);

        // Calculate FPS
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;

            // Calculate average frame time
            if (this.frameTimeHistory.length > 0) {
                const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
                this.avgFrameTime = avgFrameTime;
            }
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
            this.accumulator = 0; // Reset accumulator to prevent physics catch-up
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

        // Update FPS and frame time
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            let fpsText = `FPS: ${this.fps}`;
            if (this.avgFrameTime) {
                fpsText += ` (${this.avgFrameTime.toFixed(1)}ms)`;
            }
            fpsElement.textContent = fpsText;

            // Color code based on performance
            if (this.fps >= 55) {
                fpsElement.style.color = '#00ff00';
            } else if (this.fps >= 30) {
                fpsElement.style.color = '#ffff00';
            } else {
                fpsElement.style.color = '#ff0000';
            }
        }

        // Update latency
        const latencyElement = document.getElementById('latency');
        if (latencyElement) {
            const latency = this.game.getLatency();
            latencyElement.textContent = `Latency: ${latency}ms`;

            // Color code based on latency
            if (latency < 50) {
                latencyElement.style.color = '#00ff00';
            } else if (latency < 100) {
                latencyElement.style.color = '#ffff00';
            } else {
                latencyElement.style.color = '#ff0000';
            }
        }

        // Update interpolation stats
        const interpElement = document.getElementById('interpolation');
        if (interpElement) {
            const stats = this.game.getInterpolationStats();
            if (stats) {
                interpElement.textContent = `Entities: ${stats.entityCount} | Lerp: ${stats.lerpFactor.toFixed(3)}`;
            }
        }

        // Update player info
        if (player) {
            const posElement = document.getElementById('position');
            if (posElement) {
                posElement.textContent = `Position: (${Math.round(player.x)}, ${Math.round(player.y)})`;
            }

            const velElement = document.getElementById('velocity');
            if (velElement) {
                const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
                velElement.textContent = `Speed: ${speed.toFixed(0)}`;
            }

            const shipElement = document.getElementById('shipType');
            if (shipElement) {
                shipElement.textContent = `Ship: ${player.shipType || 'None'}`;
            }

            const healthElement = document.getElementById('health');
            if (healthElement) {
                healthElement.textContent = `Health: ${player.health || 100}%`;
            }
        }

        // Update connection status
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            if (this.game.isConnected()) {
                statusEl.textContent = 'Connected';
                statusEl.className = 'connected';
            } else {
                statusEl.textContent = 'Disconnected';
                statusEl.className = 'disconnected';
            }
        }

        // Update debug info
        const debugElement = document.getElementById('debug');
        if (debugElement) {
            debugElement.innerHTML = `
                <div style="font-size: 10px; color: #888;">
                    F1: Interpolation Debug | F2: Velocity Vectors | F3: Motion Blur | F4: Smoothing Preset
                </div>
            `;
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