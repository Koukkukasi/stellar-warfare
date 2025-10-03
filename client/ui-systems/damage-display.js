/**
 * Damage Display System - Shows floating damage numbers and hit indicators
 * Creates satisfying visual feedback for combat actions
 */

export class DamageDisplay {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.damageNumbers = [];
        this.hitMarkers = [];
        this.screenShakes = [];

        // Visual settings
        this.damageNumberLifetime = 1500; // 1.5 seconds
        this.hitMarkerLifetime = 200; // 0.2 seconds
        this.shakeIntensity = 10; // pixels

        // Damage type colors
        this.damageColors = {
            normal: '#ffff00',      // Yellow
            critical: '#ff0000',    // Red
            shield: '#00ffff',      // Cyan
            heal: '#00ff00',        // Green
            powerup: '#ff00ff'      // Magenta
        };

        // Initialize hit sound pool for better performance
        this.hitSounds = this.createSoundPool();
    }

    /**
     * Create a pool of audio elements for hit sounds
     */
    createSoundPool() {
        // In a real implementation, you'd load actual sound files
        // For now, we'll use Web Audio API to generate sounds
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        return {
            play: (type = 'normal') => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // Different frequencies for different damage types
                const frequencies = {
                    normal: 440,
                    critical: 880,
                    shield: 330,
                    powerup: 660
                };

                oscillator.frequency.value = frequencies[type] || 440;
                oscillator.type = 'square';

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            }
        };
    }

    /**
     * Add a damage number at world position
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} damage - Damage amount
     * @param {string} type - Damage type (normal, critical, shield, heal, powerup)
     * @param {Object} camera - Camera object for world-to-screen conversion
     */
    addDamageNumber(x, y, damage, type = 'normal', camera = null) {
        const isCritical = type === 'critical';
        const size = isCritical ? 32 : 24;

        const damageNumber = {
            x,
            y,
            damage: Math.round(damage),
            type,
            size,
            color: this.damageColors[type] || this.damageColors.normal,
            createdAt: Date.now(),
            velocityY: -2, // Float upward
            velocityX: (Math.random() - 0.5) * 2, // Slight random horizontal drift
            opacity: 1,
            scale: isCritical ? 1.5 : 1
        };

        this.damageNumbers.push(damageNumber);

        // Play hit sound
        if (this.hitSounds) {
            this.hitSounds.play(type);
        }

        // Add screen shake for critical hits
        if (isCritical) {
            this.addScreenShake(0.3, 15);
        }

        return damageNumber;
    }

    /**
     * Add hit marker at screen position
     * @param {number} screenX - Screen X position
     * @param {number} screenY - Screen Y position
     * @param {boolean} isKill - Whether this hit was a kill
     */
    addHitMarker(screenX, screenY, isKill = false) {
        const marker = {
            x: screenX,
            y: screenY,
            createdAt: Date.now(),
            isKill,
            scale: isKill ? 1.5 : 1,
            opacity: 1
        };

        this.hitMarkers.push(marker);
    }

    /**
     * Add screen shake effect
     * @param {number} duration - Shake duration in seconds
     * @param {number} intensity - Shake intensity in pixels
     */
    addScreenShake(duration, intensity = 10) {
        this.screenShakes.push({
            duration: duration * 1000, // Convert to ms
            intensity,
            startTime: Date.now()
        });
    }

    /**
     * Update all damage displays
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        const now = Date.now();

        // Update damage numbers
        this.damageNumbers = this.damageNumbers.filter(num => {
            const age = now - num.createdAt;

            if (age > this.damageNumberLifetime) {
                return false; // Remove expired
            }

            // Update position and opacity
            num.y += num.velocityY;
            num.x += num.velocityX;
            num.velocityY += 0.05; // Gravity effect
            num.velocityX *= 0.98; // Horizontal dampening

            // Fade out
            const fadeStart = this.damageNumberLifetime * 0.5;
            if (age > fadeStart) {
                const fadeProgress = (age - fadeStart) / (this.damageNumberLifetime - fadeStart);
                num.opacity = 1 - fadeProgress;
            }

            // Pulse effect for criticals
            if (num.type === 'critical') {
                num.scale = 1.5 + Math.sin(age * 0.01) * 0.2;
            }

            return true;
        });

        // Update hit markers
        this.hitMarkers = this.hitMarkers.filter(marker => {
            const age = now - marker.createdAt;

            if (age > this.hitMarkerLifetime) {
                return false;
            }

            // Expand and fade
            marker.scale += deltaTime * 5;
            marker.opacity = 1 - (age / this.hitMarkerLifetime);

            return true;
        });

        // Update screen shakes
        this.screenShakes = this.screenShakes.filter(shake => {
            const elapsed = now - shake.startTime;
            return elapsed < shake.duration;
        });
    }

    /**
     * Calculate current screen shake offset
     * @returns {Object} Shake offset {x, y}
     */
    getScreenShake() {
        if (this.screenShakes.length === 0) {
            return { x: 0, y: 0 };
        }

        const now = Date.now();
        let totalX = 0;
        let totalY = 0;

        this.screenShakes.forEach(shake => {
            const elapsed = now - shake.startTime;
            const progress = elapsed / shake.duration;
            const intensity = shake.intensity * (1 - progress); // Decay over time

            // Random shake direction
            totalX += (Math.random() - 0.5) * 2 * intensity;
            totalY += (Math.random() - 0.5) * 2 * intensity;
        });

        return { x: totalX, y: totalY };
    }

    /**
     * Render all damage displays
     * @param {Object} camera - Camera object for world-to-screen conversion
     */
    render(camera) {
        // Apply screen shake to canvas
        const shake = this.getScreenShake();
        this.ctx.save();
        this.ctx.translate(shake.x, shake.y);

        // Render damage numbers
        this.renderDamageNumbers(camera);

        // Render hit markers (screen space, no camera transform needed)
        this.renderHitMarkers();

        this.ctx.restore();
    }

    /**
     * Render damage numbers
     * @param {Object} camera - Camera object for world-to-screen conversion
     */
    renderDamageNumbers(camera) {
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.damageNumbers.forEach(num => {
            // Convert world position to screen position
            const screenX = (num.x - camera.x) * camera.zoom + this.canvas.width / 2;
            const screenY = (num.y - camera.y) * camera.zoom + this.canvas.height / 2;

            // Skip if off-screen
            if (screenX < -50 || screenX > this.canvas.width + 50 ||
                screenY < -50 || screenY > this.canvas.height + 50) {
                return;
            }

            this.ctx.globalAlpha = num.opacity;
            this.ctx.font = `bold ${num.size * num.scale}px Orbitron, monospace`;

            // Draw text shadow for better visibility
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(num.damage, screenX, screenY);

            // Draw damage number
            this.ctx.fillStyle = num.color;
            this.ctx.fillText(num.damage, screenX, screenY);

            // Add special effects for different types
            if (num.type === 'critical') {
                // Add exclamation mark for criticals
                this.ctx.font = `bold ${num.size * num.scale * 0.8}px Orbitron, monospace`;
                this.ctx.fillText('!', screenX + num.size * num.scale, screenY);
            } else if (num.type === 'heal') {
                // Add + sign for heals
                this.ctx.font = `bold ${num.size * num.scale * 0.8}px Orbitron, monospace`;
                this.ctx.fillText('+', screenX - num.size * num.scale * 0.5, screenY);
            }
        });

        this.ctx.restore();
    }

    /**
     * Render hit markers
     */
    renderHitMarkers() {
        this.ctx.save();

        this.hitMarkers.forEach(marker => {
            this.ctx.globalAlpha = marker.opacity;

            const size = 20 * marker.scale;
            const thickness = marker.isKill ? 4 : 2;

            // Draw crosshair hit marker
            this.ctx.strokeStyle = marker.isKill ? '#ff0000' : '#ffffff';
            this.ctx.lineWidth = thickness;

            // Top line
            this.ctx.beginPath();
            this.ctx.moveTo(marker.x, marker.y - size);
            this.ctx.lineTo(marker.x, marker.y - size / 2);
            this.ctx.stroke();

            // Bottom line
            this.ctx.beginPath();
            this.ctx.moveTo(marker.x, marker.y + size / 2);
            this.ctx.lineTo(marker.x, marker.y + size);
            this.ctx.stroke();

            // Left line
            this.ctx.beginPath();
            this.ctx.moveTo(marker.x - size, marker.y);
            this.ctx.lineTo(marker.x - size / 2, marker.y);
            this.ctx.stroke();

            // Right line
            this.ctx.beginPath();
            this.ctx.moveTo(marker.x + size / 2, marker.y);
            this.ctx.lineTo(marker.x + size, marker.y);
            this.ctx.stroke();

            // Add X for kills
            if (marker.isKill) {
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = thickness * 1.5;

                // Draw X
                this.ctx.beginPath();
                this.ctx.moveTo(marker.x - size * 0.7, marker.y - size * 0.7);
                this.ctx.lineTo(marker.x + size * 0.7, marker.y + size * 0.7);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(marker.x + size * 0.7, marker.y - size * 0.7);
                this.ctx.lineTo(marker.x - size * 0.7, marker.y + size * 0.7);
                this.ctx.stroke();
            }
        });

        this.ctx.restore();
    }

    /**
     * Add directional damage indicator
     * @param {number} angle - Angle from player to damage source
     * @param {number} damage - Damage amount
     */
    addDirectionalIndicator(angle, damage) {
        // This would show damage direction on screen edges
        const indicator = {
            angle,
            damage,
            createdAt: Date.now(),
            lifetime: 1000
        };

        // Implementation would render arrows at screen edges pointing to damage source
        // For brevity, focusing on other systems
    }

    /**
     * Clear all displays
     */
    clear() {
        this.damageNumbers = [];
        this.hitMarkers = [];
        this.screenShakes = [];
    }
}