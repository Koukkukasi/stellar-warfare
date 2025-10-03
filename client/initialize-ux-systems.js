/**
 * Initialize UX Systems - Integration point for all UX improvements
 * Import this file in main.js to activate all enhanced UX features
 */

import { KillFeed } from './ui-systems/killfeed.js';
import { DamageDisplay } from './ui-systems/damage-display.js';
import { EnhancedHUD } from './ui-systems/enhanced-hud.js';
import { ProgressionSystem } from './systems/progression.js';
import { TutorialSystem } from './systems/tutorial.js';

export class UXSystemManager {
    constructor(game, renderer, inputHandler, canvas, ctx) {
        this.game = game;
        this.renderer = renderer;
        this.inputHandler = inputHandler;
        this.canvas = canvas;
        this.ctx = ctx;

        // Initialize all UX systems
        this.initializeSystems();

        // Hook into game events
        this.setupEventListeners();
    }

    initializeSystems() {
        // Kill feed for combat notifications
        this.killFeed = new KillFeed();

        // Damage display for visual feedback
        this.damageDisplay = new DamageDisplay(this.canvas, this.ctx);

        // Enhanced HUD for better information display
        this.hud = new EnhancedHUD(this.canvas);

        // Progression system for player retention
        this.progression = new ProgressionSystem();

        // Tutorial system for onboarding
        this.tutorial = new TutorialSystem(this.game, this.renderer, this.inputHandler);

        // Make progression globally accessible for other systems
        window.progressionSystem = this.progression;

        // Check daily challenges
        this.progression.checkDailyReset();
    }

    setupEventListeners() {
        // Listen for game state updates from server
        if (this.game.socket) {
            // Combat events
            this.game.socket.on('playerKilled', (data) => {
                this.handleKillEvent(data);
            });

            this.game.socket.on('damageDealt', (data) => {
                this.handleDamageEvent(data);
            });

            this.game.socket.on('powerUpCollected', (data) => {
                this.handlePowerUpEvent(data);
            });

            // Match events
            this.game.socket.on('matchEnd', (data) => {
                this.handleMatchEnd(data);
            });
        }

        // Input events for tutorial tracking
        const originalSetInput = this.game.setInput.bind(this.game);
        this.game.setInput = (key, value) => {
            originalSetInput(key, value);

            // Track shooting for tutorial
            if (key === 'fire' && value === true) {
                this.tutorial.onShot();
            }
        };
    }

    /**
     * Handle kill event
     */
    handleKillEvent(data) {
        const isPlayer = data.killerId === this.game.playerId;
        const killerName = data.killerName || 'Player';
        const victimName = data.victimName || 'Enemy';

        // Add to kill feed
        this.killFeed.addKill(killerName, victimName, data.weapon || 'Blaster', isPlayer);

        // Update HUD stats if player
        if (isPlayer) {
            this.currentKills = (this.currentKills || 0) + 1;
            this.currentStreak = (this.currentStreak || 0) + 1;

            this.hud.updateStats({
                kills: this.currentKills,
                streak: this.currentStreak,
                score: this.currentScore || 0
            });

            // Add XP for kill
            this.progression.addXP(100, 'Enemy Eliminated');
        } else if (data.victimId === this.game.playerId) {
            // Player was killed
            this.currentDeaths = (this.currentDeaths || 0) + 1;
            this.currentStreak = 0;

            this.hud.updateStats({
                deaths: this.currentDeaths,
                streak: 0
            });

            // Show respawn notification
            this.hud.showNotification('Eliminated! Respawning...', 'danger');
        }

        // Tutorial tracking
        if (isPlayer && data.targetType === 'tutorial-target') {
            this.tutorial.onTargetDestroyed(data.targetId);
        }
    }

    /**
     * Handle damage event
     */
    handleDamageEvent(data) {
        // Add damage number at hit location
        if (data.x && data.y) {
            const damageType = data.critical ? 'critical' : 'normal';
            this.damageDisplay.addDamageNumber(
                data.x,
                data.y,
                data.damage,
                damageType,
                this.renderer.camera
            );
        }

        // Add hit marker if player dealt damage
        if (data.attackerId === this.game.playerId) {
            const screenX = this.canvas.width / 2 + (Math.random() - 0.5) * 100;
            const screenY = this.canvas.height / 2 + (Math.random() - 0.5) * 100;
            this.damageDisplay.addHitMarker(screenX, screenY, data.targetDestroyed);

            // Update crosshair
            this.hud.updateCrosshair(data.targetDestroyed ? 'locked' : 'normal');
            setTimeout(() => this.hud.updateCrosshair('normal'), 200);
        }

        // Show damage flash if player took damage
        if (data.targetId === this.game.playerId) {
            this.hud.showDamageFlash(data.damage / 100);
            this.damageDisplay.addScreenShake(0.2, 5);
        }
    }

    /**
     * Handle power-up collection
     */
    handlePowerUpEvent(data) {
        if (data.playerId === this.game.playerId) {
            // Add to HUD
            this.hud.addPowerUp({
                id: data.powerUpId,
                name: data.name || 'Power-Up',
                icon: data.icon || '⚡',
                color: data.color || '#00ff00',
                duration: data.duration || 10,
                remaining: data.duration || 10
            });

            // Show notification
            this.hud.showNotification(`${data.name} Activated!`, 'success');

            // Tutorial tracking
            this.tutorial.onPowerUpCollected();

            // Add XP
            this.progression.addXP(50, 'Power-Up Collected');
        }
    }

    /**
     * Handle match end
     */
    handleMatchEnd(data) {
        // Calculate match stats
        const matchStats = {
            kills: this.currentKills || 0,
            deaths: this.currentDeaths || 0,
            assists: data.assists || 0,
            damage: data.totalDamage || 0,
            won: data.won || false,
            survivalTime: data.survivalTime || 0,
            highestKillStreak: this.highestStreak || 0
        };

        // Update progression
        this.progression.updateMatchStats(matchStats);

        // Reset current match stats
        this.currentKills = 0;
        this.currentDeaths = 0;
        this.currentStreak = 0;
        this.highestStreak = 0;
        this.currentScore = 0;

        // Show match summary
        this.showMatchSummary(data);
    }

    /**
     * Show match summary screen
     */
    showMatchSummary(data) {
        const summary = document.createElement('div');
        summary.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 500;
            animation: fadeIn 0.5s ease-out;
        `;

        const result = data.won ? 'VICTORY' : 'DEFEAT';
        const resultColor = data.won ? '#00ff00' : '#ff0000';

        summary.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,50,100,0.9));
                border: 3px solid ${resultColor};
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                font-family: Orbitron, monospace;
                min-width: 500px;
            ">
                <h1 style="color: ${resultColor}; font-size: 48px; margin: 0 0 30px 0;">
                    ${result}
                </h1>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
                    <div>
                        <div style="color: #aaa; font-size: 14px;">KILLS</div>
                        <div style="color: white; font-size: 24px; font-weight: bold;">${data.kills || 0}</div>
                    </div>
                    <div>
                        <div style="color: #aaa; font-size: 14px;">DEATHS</div>
                        <div style="color: white; font-size: 24px; font-weight: bold;">${data.deaths || 0}</div>
                    </div>
                    <div>
                        <div style="color: #aaa; font-size: 14px;">DAMAGE</div>
                        <div style="color: white; font-size: 24px; font-weight: bold;">${data.totalDamage || 0}</div>
                    </div>
                    <div>
                        <div style="color: #aaa; font-size: 14px;">SCORE</div>
                        <div style="color: white; font-size: 24px; font-weight: bold;">${data.score || 0}</div>
                    </div>
                </div>

                <div style="margin: 30px 0;">
                    <div style="color: #00ffff; font-size: 18px; margin-bottom: 10px;">XP EARNED</div>
                    <div style="color: #00ff00; font-size: 32px; font-weight: bold;">
                        +${data.xpEarned || 500}
                    </div>
                </div>

                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: linear-gradient(135deg, #00ffff, #00ff00);
                    border: none;
                    color: black;
                    padding: 15px 40px;
                    font-size: 18px;
                    font-weight: bold;
                    font-family: Orbitron, monospace;
                    cursor: pointer;
                    border-radius: 5px;
                    margin-top: 20px;
                ">CONTINUE</button>
            </div>
        `;

        document.body.appendChild(summary);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (summary.parentElement) {
                summary.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => summary.remove(), 500);
            }
        }, 10000);
    }

    /**
     * Update loop (called each frame)
     */
    update(deltaTime) {
        // Update game state for HUD
        const state = this.game.getState();
        if (state.player) {
            // Update HUD with current player stats
            this.hud.updateStats({
                health: state.player.health || 100,
                maxHealth: 100,
                shield: state.player.shield || 0,
                maxShield: 100,
                energy: state.player.energy || 100,
                maxEnergy: 100,
                score: this.currentScore || 0,
                kills: this.currentKills || 0,
                deaths: this.currentDeaths || 0,
                streak: this.currentStreak || 0
            });

            // Update speed indicator
            this.hud.updateSpeed({
                x: state.player.vx || 0,
                y: state.player.vy || 0
            });

            // Update weapon cooldowns (mock data for now)
            this.hud.updateWeapon({
                primary: {
                    name: 'Blaster',
                    cooldown: 0,
                    maxCooldown: 0.2
                },
                secondary: {
                    name: 'Missiles',
                    cooldown: 0,
                    maxCooldown: 5,
                    ammo: 3
                }
            });
        }

        // Update other systems
        this.killFeed.update();
        this.damageDisplay.update(deltaTime);
        this.tutorial.update(deltaTime);
    }

    /**
     * Render loop (called each frame)
     */
    render() {
        // Render damage display effects
        this.damageDisplay.render(this.renderer.camera);

        // Render tutorial elements
        this.tutorial.render(this.ctx, this.renderer.camera);
    }

    /**
     * Clean up all systems
     */
    destroy() {
        this.killFeed.clear();
        this.damageDisplay.clear();
        this.hud.destroy();
        // Don't destroy progression - it persists
    }
}

// Integration helper for easy setup
export function initializeEnhancedUX(game, renderer, inputHandler, canvas, ctx) {
    return new UXSystemManager(game, renderer, inputHandler, canvas, ctx);
}