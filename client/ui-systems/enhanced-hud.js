/**
 * Enhanced HUD System - Modern, informative, and visually engaging HUD
 * Replaces the basic terminal-style HUD with a dynamic gaming interface
 */

export class EnhancedHUD {
    constructor(canvas) {
        this.canvas = canvas;

        // HUD state
        this.playerStats = {
            health: 100,
            maxHealth: 100,
            shield: 50,
            maxShield: 100,
            energy: 100,
            maxEnergy: 100,
            ammo: 50,
            maxAmmo: 50,
            score: 0,
            kills: 0,
            deaths: 0,
            streak: 0
        };

        this.weaponInfo = {
            primary: { name: 'Blaster', cooldown: 0, maxCooldown: 0.2 },
            secondary: { name: 'Missiles', cooldown: 0, maxCooldown: 5, ammo: 3 }
        };

        this.powerUps = [];
        this.notifications = [];

        // Visual settings
        this.healthColor = '#00ff00';
        this.shieldColor = '#00ffff';
        this.energyColor = '#ffff00';
        this.dangerColor = '#ff0000';

        // Initialize DOM elements
        this.initializeHUD();
    }

    initializeHUD() {
        // Remove old basic HUD
        const oldUI = document.getElementById('ui');
        const oldControls = document.getElementById('controls');
        if (oldUI) oldUI.remove();
        if (oldControls) oldControls.remove();

        // Create new HUD container
        const hudContainer = document.createElement('div');
        hudContainer.id = 'enhanced-hud';
        hudContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
            font-family: 'Orbitron', monospace;
        `;

        // Top center - Score and stats
        const topStats = document.createElement('div');
        topStats.id = 'top-stats';
        topStats.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            color: white;
        `;
        topStats.innerHTML = `
            <div style="font-size: 32px; font-weight: bold; text-shadow: 0 0 10px #00ffff;">
                <span id="player-score">0</span>
            </div>
            <div style="margin-top: 5px; font-size: 14px; color: #aaa;">
                <span id="player-kd">K: 0 D: 0</span> |
                <span id="player-streak" style="color: #ffaa00;">Streak: 0</span>
            </div>
        `;

        // Bottom left - Health and shields
        const vitalBars = document.createElement('div');
        vitalBars.id = 'vital-bars';
        vitalBars.style.cssText = `
            position: absolute;
            bottom: 30px;
            left: 30px;
            width: 300px;
        `;
        vitalBars.innerHTML = `
            <div class="bar-container" style="margin-bottom: 10px;">
                <div class="bar-label" style="color: #00ff00; font-size: 12px; margin-bottom: 3px;">HEALTH</div>
                <div class="bar-bg" style="background: rgba(0,0,0,0.5); border: 1px solid #00ff00; height: 20px; position: relative;">
                    <div id="health-bar" class="bar-fill" style="background: linear-gradient(90deg, #00ff00, #00aa00); width: 100%; height: 100%; transition: width 0.3s;"></div>
                    <div id="health-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 12px; font-weight: bold;">100/100</div>
                </div>
            </div>
            <div class="bar-container" style="margin-bottom: 10px;">
                <div class="bar-label" style="color: #00ffff; font-size: 12px; margin-bottom: 3px;">SHIELD</div>
                <div class="bar-bg" style="background: rgba(0,0,0,0.5); border: 1px solid #00ffff; height: 16px; position: relative;">
                    <div id="shield-bar" class="bar-fill" style="background: linear-gradient(90deg, #00ffff, #0088ff); width: 50%; height: 100%; transition: width 0.3s;"></div>
                    <div id="shield-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 11px;">50/100</div>
                </div>
            </div>
            <div class="bar-container">
                <div class="bar-label" style="color: #ffff00; font-size: 12px; margin-bottom: 3px;">ENERGY</div>
                <div class="bar-bg" style="background: rgba(0,0,0,0.5); border: 1px solid #ffff00; height: 12px; position: relative;">
                    <div id="energy-bar" class="bar-fill" style="background: linear-gradient(90deg, #ffff00, #aaaa00); width: 100%; height: 100%; transition: width 0.3s;"></div>
                </div>
            </div>
        `;

        // Bottom right - Weapon info
        const weaponInfo = document.createElement('div');
        weaponInfo.id = 'weapon-info';
        weaponInfo.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 30px;
            text-align: right;
            color: white;
        `;
        weaponInfo.innerHTML = `
            <div id="primary-weapon" style="margin-bottom: 10px;">
                <div style="color: #00ff00; font-size: 14px; font-weight: bold;">BLASTER</div>
                <div id="primary-ammo" style="font-size: 24px; font-weight: bold;">∞</div>
                <div id="primary-cooldown" style="height: 3px; background: rgba(0,255,0,0.3); margin-top: 5px;">
                    <div style="height: 100%; background: #00ff00; width: 0%; transition: width 0.1s;"></div>
                </div>
            </div>
            <div id="secondary-weapon">
                <div style="color: #ff8800; font-size: 14px; font-weight: bold;">MISSILES</div>
                <div id="secondary-ammo" style="font-size: 20px; font-weight: bold;">3/3</div>
                <div id="secondary-cooldown" style="height: 3px; background: rgba(255,136,0,0.3); margin-top: 5px;">
                    <div style="height: 100%; background: #ff8800; width: 0%; transition: width 0.1s;"></div>
                </div>
            </div>
        `;

        // Top right - Power-ups
        const powerUpDisplay = document.createElement('div');
        powerUpDisplay.id = 'powerup-display';
        powerUpDisplay.style.cssText = `
            position: absolute;
            top: 80px;
            right: 30px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        // Center - Crosshair
        const crosshair = document.createElement('div');
        crosshair.id = 'crosshair';
        crosshair.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            pointer-events: none;
        `;
        crosshair.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(0,255,255,0.3)" stroke-width="1"/>
                <line x1="20" y1="5" x2="20" y2="12" stroke="#00ffff" stroke-width="2"/>
                <line x1="20" y1="28" x2="20" y2="35" stroke="#00ffff" stroke-width="2"/>
                <line x1="5" y1="20" x2="12" y2="20" stroke="#00ffff" stroke-width="2"/>
                <line x1="28" y1="20" x2="35" y2="20" stroke="#00ffff" stroke-width="2"/>
                <circle cx="20" cy="20" r="2" fill="#00ffff"/>
            </svg>
        `;

        // Speed indicator
        const speedIndicator = document.createElement('div');
        speedIndicator.id = 'speed-indicator';
        speedIndicator.style.cssText = `
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            text-align: center;
        `;
        speedIndicator.innerHTML = `
            <div style="color: #aaa; font-size: 11px; margin-bottom: 3px;">VELOCITY</div>
            <div id="speed-bar" style="height: 4px; background: rgba(255,255,255,0.2);">
                <div id="speed-fill" style="height: 100%; background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000); width: 0%; transition: width 0.1s;"></div>
            </div>
            <div id="speed-text" style="color: white; font-size: 14px; margin-top: 3px;">0 m/s</div>
        `;

        // Notification area
        const notificationArea = document.createElement('div');
        notificationArea.id = 'notification-area';
        notificationArea.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 100;
        `;

        // Append all elements
        hudContainer.appendChild(topStats);
        hudContainer.appendChild(vitalBars);
        hudContainer.appendChild(weaponInfo);
        hudContainer.appendChild(powerUpDisplay);
        hudContainer.appendChild(crosshair);
        hudContainer.appendChild(speedIndicator);
        hudContainer.appendChild(notificationArea);

        document.body.appendChild(hudContainer);

        // Add damage flash overlay
        const damageOverlay = document.createElement('div');
        damageOverlay.id = 'damage-overlay';
        damageOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 45;
            opacity: 0;
            transition: opacity 0.2s;
        `;
        document.body.appendChild(damageOverlay);
    }

    /**
     * Update player stats
     */
    updateStats(stats) {
        // Update stored stats
        Object.assign(this.playerStats, stats);

        // Update health bar
        const healthPercent = (this.playerStats.health / this.playerStats.maxHealth) * 100;
        const healthBar = document.getElementById('health-bar');
        const healthText = document.getElementById('health-text');
        if (healthBar) {
            healthBar.style.width = `${healthPercent}%`;

            // Change color based on health
            if (healthPercent < 25) {
                healthBar.style.background = 'linear-gradient(90deg, #ff0000, #aa0000)';
                this.pulseElement(healthBar.parentElement);
            } else if (healthPercent < 50) {
                healthBar.style.background = 'linear-gradient(90deg, #ffaa00, #aa5500)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #00ff00, #00aa00)';
            }
        }
        if (healthText) {
            healthText.textContent = `${Math.round(this.playerStats.health)}/${this.playerStats.maxHealth}`;
        }

        // Update shield bar
        const shieldPercent = (this.playerStats.shield / this.playerStats.maxShield) * 100;
        const shieldBar = document.getElementById('shield-bar');
        const shieldText = document.getElementById('shield-text');
        if (shieldBar) {
            shieldBar.style.width = `${shieldPercent}%`;
        }
        if (shieldText) {
            shieldText.textContent = `${Math.round(this.playerStats.shield)}/${this.playerStats.maxShield}`;
        }

        // Update energy bar
        const energyPercent = (this.playerStats.energy / this.playerStats.maxEnergy) * 100;
        const energyBar = document.getElementById('energy-bar');
        if (energyBar) {
            energyBar.style.width = `${energyPercent}%`;
        }

        // Update score and K/D
        const scoreElement = document.getElementById('player-score');
        const kdElement = document.getElementById('player-kd');
        const streakElement = document.getElementById('player-streak');

        if (scoreElement) scoreElement.textContent = this.playerStats.score.toLocaleString();
        if (kdElement) kdElement.textContent = `K: ${this.playerStats.kills} D: ${this.playerStats.deaths}`;
        if (streakElement) {
            streakElement.textContent = `Streak: ${this.playerStats.streak}`;
            if (this.playerStats.streak >= 3) {
                streakElement.style.color = '#ff0000';
                streakElement.style.textShadow = '0 0 10px #ff0000';
            } else if (this.playerStats.streak >= 2) {
                streakElement.style.color = '#ffaa00';
            }
        }
    }

    /**
     * Update weapon information
     */
    updateWeapon(weaponData) {
        Object.assign(this.weaponInfo, weaponData);

        // Update primary weapon
        const primaryCooldown = document.querySelector('#primary-cooldown > div');
        if (primaryCooldown && this.weaponInfo.primary) {
            const cooldownPercent = (this.weaponInfo.primary.cooldown / this.weaponInfo.primary.maxCooldown) * 100;
            primaryCooldown.style.width = `${cooldownPercent}%`;
        }

        // Update secondary weapon
        const secondaryAmmo = document.getElementById('secondary-ammo');
        const secondaryCooldown = document.querySelector('#secondary-cooldown > div');

        if (secondaryAmmo && this.weaponInfo.secondary) {
            secondaryAmmo.textContent = `${this.weaponInfo.secondary.ammo}/3`;
        }

        if (secondaryCooldown && this.weaponInfo.secondary) {
            const cooldownPercent = (this.weaponInfo.secondary.cooldown / this.weaponInfo.secondary.maxCooldown) * 100;
            secondaryCooldown.style.width = `${cooldownPercent}%`;
        }
    }

    /**
     * Update speed indicator
     */
    updateSpeed(velocity) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const maxSpeed = 400; // Adjust based on game
        const speedPercent = Math.min((speed / maxSpeed) * 100, 100);

        const speedFill = document.getElementById('speed-fill');
        const speedText = document.getElementById('speed-text');

        if (speedFill) {
            speedFill.style.width = `${speedPercent}%`;
        }

        if (speedText) {
            speedText.textContent = `${Math.round(speed)} m/s`;
        }
    }

    /**
     * Add power-up indicator
     */
    addPowerUp(powerUp) {
        const display = document.getElementById('powerup-display');
        if (!display) return;

        const powerUpElement = document.createElement('div');
        powerUpElement.id = `powerup-${powerUp.id}`;
        powerUpElement.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            background: rgba(0,0,0,0.7);
            border: 1px solid ${powerUp.color};
            border-radius: 5px;
            animation: powerUpGlow 1s ease-in-out infinite;
        `;

        powerUpElement.innerHTML = `
            <div style="font-size: 24px;">${powerUp.icon}</div>
            <div>
                <div style="color: ${powerUp.color}; font-size: 12px; font-weight: bold;">${powerUp.name}</div>
                <div style="color: white; font-size: 10px;">${powerUp.duration}s</div>
            </div>
            <div style="width: 30px; height: 30px; position: relative;">
                <svg width="30" height="30" style="transform: rotate(-90deg);">
                    <circle cx="15" cy="15" r="12" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
                    <circle cx="15" cy="15" r="12" fill="none" stroke="${powerUp.color}" stroke-width="2"
                            stroke-dasharray="${75 * (powerUp.remaining / powerUp.duration)} 75"
                            style="transition: stroke-dasharray 0.1s linear;"/>
                </svg>
            </div>
        `;

        display.appendChild(powerUpElement);
        this.powerUps.push(powerUp);

        // Auto-remove after duration
        setTimeout(() => {
            this.removePowerUp(powerUp.id);
        }, powerUp.duration * 1000);
    }

    /**
     * Remove power-up indicator
     */
    removePowerUp(id) {
        const element = document.getElementById(`powerup-${id}`);
        if (element) {
            element.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => element.remove(), 300);
        }
        this.powerUps = this.powerUps.filter(p => p.id !== id);
    }

    /**
     * Show damage flash
     */
    showDamageFlash(intensity = 0.3) {
        const overlay = document.getElementById('damage-overlay');
        if (!overlay) return;

        // Red flash with gradient from edges
        overlay.style.background = `radial-gradient(circle, transparent 30%, rgba(255,0,0,${intensity}) 100%)`;
        overlay.style.opacity = '1';

        setTimeout(() => {
            overlay.style.opacity = '0';
        }, 200);
    }

    /**
     * Show notification
     */
    showNotification(text, type = 'info', duration = 3000) {
        const area = document.getElementById('notification-area');
        if (!area) return;

        const colors = {
            info: '#00ffff',
            success: '#00ff00',
            warning: '#ffaa00',
            danger: '#ff0000',
            epic: '#ff00ff'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            padding: 15px 30px;
            margin: 10px;
            background: rgba(0,0,0,0.8);
            border: 2px solid ${colors[type]};
            color: ${colors[type]};
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            text-shadow: 0 0 10px ${colors[type]};
            animation: notificationPulse 0.5s ease-out;
        `;
        notification.textContent = text;

        area.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }

    /**
     * Pulse element for attention
     */
    pulseElement(element) {
        if (!element) return;
        element.style.animation = 'hudPulse 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    /**
     * Update crosshair state
     */
    updateCrosshair(state = 'normal') {
        const crosshair = document.getElementById('crosshair');
        if (!crosshair) return;

        const svg = crosshair.querySelector('svg');
        const colors = {
            normal: '#00ffff',
            locked: '#ff0000',
            friendly: '#00ff00',
            disabled: '#666666'
        };

        const color = colors[state] || colors.normal;
        svg.querySelectorAll('line, circle').forEach(el => {
            if (el.tagName === 'circle' && el.getAttribute('r') === '18') {
                el.setAttribute('stroke', color.replace('#', 'rgba(') + ',0.3)');
            } else {
                el.setAttribute('stroke', color);
                el.setAttribute('fill', color);
            }
        });

        if (state === 'locked') {
            crosshair.style.transform = 'translate(-50%, -50%) scale(1.2)';
            setTimeout(() => {
                crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);
        }
    }

    /**
     * Clean up HUD
     */
    destroy() {
        const elements = [
            'enhanced-hud',
            'damage-overlay'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });

        this.powerUps = [];
        this.notifications = [];
    }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent += `
    @keyframes powerUpGlow {
        0%, 100% { box-shadow: 0 0 5px currentColor; }
        50% { box-shadow: 0 0 15px currentColor; }
    }

    @keyframes hudPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }

    @keyframes notificationPulse {
        0% {
            transform: scale(0.8);
            opacity: 0;
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
`;