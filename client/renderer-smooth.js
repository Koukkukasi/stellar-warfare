import { CameraSystem } from './interpolation.js';

export class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;

        // Initialize smooth camera system
        this.camera = new CameraSystem();

        // Visual settings
        this.showGrid = true;
        this.gridSize = 50;
        this.starField = this.generateStarField(200);

        // Performance monitoring
        this.renderTime = 0;
        this.lastRenderTime = performance.now();

        // Motion blur effect (optional)
        this.motionBlurEnabled = false;
        this.motionBlurAlpha = 0.9;

        // Debug visualization
        this.showInterpolationDebug = false;
        this.showVelocityVectors = false;
    }

    updateCanvasSize(canvas) {
        this.canvas = canvas;
    }

    generateStarField(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * 4000 - 2000,
                y: Math.random() * 4000 - 2000,
                size: Math.random() * 2,
                brightness: Math.random() * 0.5 + 0.5,
                parallax: 0.1 + Math.random() * 0.4 // Parallax factor for depth
            });
        }
        return stars;
    }

    render(state, deltaTime = 0.016, interpolationStats = null) {
        const startTime = performance.now();

        // Apply motion blur if enabled
        if (this.motionBlurEnabled) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.motionBlurAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Clear canvas
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Update camera to follow player smoothly
        if (state.player) {
            this.camera.setTarget(state.player.x, state.player.y);
        }
        this.camera.update(deltaTime);

        // Get camera position with shake applied
        const cameraPos = this.camera.getPosition();

        // Save context state
        this.ctx.save();

        // Apply camera transform
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-cameraPos.x, -cameraPos.y);

        // Render layers in order
        this.renderStarField(cameraPos);

        if (this.showGrid) {
            this.renderGrid(cameraPos);
        }

        // Render entities with smooth interpolation
        this.renderEntities(state.entities);

        // Render projectiles with trails
        this.renderProjectiles(state.projectiles);

        // Render player (always on top)
        if (state.player) {
            this.renderShip(state.player, true);
        }

        // Render debug information if enabled
        if (this.showInterpolationDebug && interpolationStats) {
            this.renderInterpolationDebug(interpolationStats);
        }

        // Restore context state
        this.ctx.restore();

        // Render UI overlay
        this.renderUIOverlay(state, interpolationStats);

        // Update render time
        this.renderTime = performance.now() - startTime;
    }

    renderStarField(cameraPos) {
        this.starField.forEach(star => {
            // Apply parallax effect for depth
            const parallaxX = star.x - cameraPos.x * star.parallax;
            const parallaxY = star.y - cameraPos.y * star.parallax;

            // Twinkle effect
            const twinkle = Math.sin(performance.now() * 0.001 + star.x + star.y) * 0.2 + 0.8;

            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
            this.ctx.fillRect(parallaxX, parallaxY, star.size, star.size);
        });
    }

    renderGrid(cameraPos) {
        const gridColor = 'rgba(0, 255, 0, 0.1)';
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

        const viewWidth = this.canvas.width / this.camera.zoom;
        const viewHeight = this.canvas.height / this.camera.zoom;

        const startX = Math.floor((cameraPos.x - viewWidth / 2) / this.gridSize) * this.gridSize;
        const startY = Math.floor((cameraPos.y - viewHeight / 2) / this.gridSize) * this.gridSize;
        const endX = cameraPos.x + viewWidth / 2;
        const endY = cameraPos.y + viewHeight / 2;

        // Vertical lines
        for (let x = startX; x < endX; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y < endY; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    renderEntities(entities) {
        if (!entities) return;

        entities.forEach(entity => {
            if (entity.type === 'ship') {
                this.renderShip(entity, false);

                // Show velocity vectors if enabled
                if (this.showVelocityVectors && entity.vx !== undefined && entity.vy !== undefined) {
                    this.renderVelocityVector(entity);
                }
            } else if (entity.type === 'asteroid') {
                this.renderAsteroid(entity);
            }
        });
    }

    renderAsteroid(asteroid) {
        this.ctx.save();
        this.ctx.translate(asteroid.x, asteroid.y);
        this.ctx.rotate(asteroid.rotation || 0);

        // Add subtle glow effect
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.radius || 20);
        gradient.addColorStop(0, 'rgba(100, 100, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-asteroid.radius * 1.5, -asteroid.radius * 1.5,
                          asteroid.radius * 3, asteroid.radius * 3);

        this.ctx.strokeStyle = '#888';
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        this.ctx.lineWidth = 2;

        const radius = asteroid.radius || 20;
        const points = 8;

        // Draw irregular asteroid shape
        this.ctx.beginPath();
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const variance = 0.7 + (((asteroid.id || 0) * i) % 30) / 100;
            const r = radius * variance;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();

        this.ctx.restore();
    }

    renderShip(ship, isPlayer) {
        this.ctx.save();
        this.ctx.translate(ship.x, ship.y);
        this.ctx.rotate(ship.angle);

        const shipType = ship.shipType || 'Interceptor';
        const color = isPlayer ? '#00ff00' : '#ff0000';

        // Add engine trail effect based on velocity
        if (ship.vx !== undefined && ship.vy !== undefined) {
            const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
            if (speed > 10) {
                this.renderEngineTrail(speed / 400); // Normalize to max speed
            }
        }

        switch (shipType) {
            case 'Interceptor':
                this.renderInterceptor(color);
                break;
            case 'Gunship':
                this.renderGunship(color);
                break;
            case 'Cruiser':
                this.renderCruiser(color);
                break;
            default:
                this.renderInterceptor(color);
        }

        // Render health bar
        if (ship.health !== undefined) {
            this.renderHealthBar(ship.health, 30);
        }

        // Render shield effect if present
        if (ship.shield && ship.shield > 0) {
            this.renderShield(ship.shield);
        }

        this.ctx.restore();

        // Render name tag
        if (ship.name) {
            this.ctx.save();
            this.ctx.fillStyle = color;
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ship.name, ship.x, ship.y - 30);
            this.ctx.restore();
        }
    }

    renderEngineTrail(intensity) {
        // Engine glow trail
        const gradient = this.ctx.createLinearGradient(-20, 0, -10, 0);
        gradient.addColorStop(0, `rgba(0, 170, 255, 0)`);
        gradient.addColorStop(1, `rgba(0, 170, 255, ${intensity * 0.8})`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-20 - intensity * 10, -3 - intensity * 2,
                          10 + intensity * 10, 6 + intensity * 4);
    }

    renderShield(shieldStrength) {
        const radius = 25;
        const alpha = shieldStrength / 100;

        this.ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Shield shimmer effect
        const shimmer = Math.sin(performance.now() * 0.005) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(0, 200, 255, ${alpha * 0.2 * shimmer})`;
        this.ctx.fill();
    }

    renderVelocityVector(entity) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);

        const vectorScale = 0.2;
        this.ctx.beginPath();
        this.ctx.moveTo(entity.x, entity.y);
        this.ctx.lineTo(entity.x + entity.vx * vectorScale,
                       entity.y + entity.vy * vectorScale);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    renderInterceptor(color) {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2;

        // Main body (triangle)
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(-10, -8);
        this.ctx.lineTo(-10, 8);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        // Cockpit with gradient
        const cockpitGradient = this.ctx.createRadialGradient(5, 0, 0, 5, 0, 3);
        cockpitGradient.addColorStop(0, color);
        cockpitGradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
        this.ctx.fillStyle = cockpitGradient;
        this.ctx.beginPath();
        this.ctx.arc(5, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Engine glow with pulsing effect
        const pulse = Math.sin(performance.now() * 0.01) * 0.2 + 0.8;
        this.ctx.fillStyle = '#00aaff';
        this.ctx.globalAlpha = 0.6 * pulse;
        this.ctx.fillRect(-12, -3, 3, 6);
        this.ctx.globalAlpha = 1;
    }

    renderGunship(color) {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2;

        // Main body (wider triangle)
        this.ctx.beginPath();
        this.ctx.moveTo(12, 0);
        this.ctx.lineTo(-8, -12);
        this.ctx.lineTo(-8, 12);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        // Weapon mounts with pulsing
        const weaponPulse = Math.sin(performance.now() * 0.008) * 0.3 + 0.7;
        this.ctx.globalAlpha = weaponPulse;
        this.ctx.strokeRect(-3, -10, 8, 4);
        this.ctx.strokeRect(-3, 6, 8, 4);
        this.ctx.globalAlpha = 1;

        // Cockpit
        this.ctx.beginPath();
        this.ctx.arc(2, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Engine glow
        this.ctx.fillStyle = '#00aaff';
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillRect(-10, -4, 3, 8);
        this.ctx.globalAlpha = 1;
    }

    renderCruiser(color) {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2;

        // Main body (large rectangle with angled front)
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(5, -10);
        this.ctx.lineTo(-15, -10);
        this.ctx.lineTo(-15, 10);
        this.ctx.lineTo(5, 10);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        // Bridge with window effect
        const bridgeGradient = this.ctx.createLinearGradient(-5, -6, -5, 6);
        bridgeGradient.addColorStop(0, 'rgba(100, 200, 255, 0.5)');
        bridgeGradient.addColorStop(1, 'rgba(100, 200, 255, 0.1)');
        this.ctx.fillStyle = bridgeGradient;
        this.ctx.fillRect(-5, -6, 10, 12);
        this.ctx.strokeRect(-5, -6, 10, 12);

        // Weapon turrets with rotation
        const turretRotation = performance.now() * 0.002;
        this.ctx.save();
        this.ctx.translate(5, -8);
        this.ctx.rotate(turretRotation);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(5, 8);
        this.ctx.rotate(-turretRotation);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Engine glow
        this.ctx.fillStyle = '#00aaff';
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillRect(-17, -6, 3, 12);
        this.ctx.globalAlpha = 1;
    }

    renderHealthBar(health, width) {
        const height = 4;
        const y = -25;

        // Background
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.fillRect(-width / 2, y, width, height);

        // Health with gradient
        const healthWidth = (health / 100) * width;
        const healthGradient = this.ctx.createLinearGradient(-width / 2, 0, -width / 2 + healthWidth, 0);

        if (health > 60) {
            healthGradient.addColorStop(0, '#00ff00');
            healthGradient.addColorStop(1, '#00cc00');
        } else if (health > 30) {
            healthGradient.addColorStop(0, '#ffff00');
            healthGradient.addColorStop(1, '#cccc00');
        } else {
            healthGradient.addColorStop(0, '#ff0000');
            healthGradient.addColorStop(1, '#cc0000');
        }

        this.ctx.fillStyle = healthGradient;
        this.ctx.fillRect(-width / 2, y, healthWidth, height);

        // Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-width / 2, y, width, height);
    }

    renderProjectiles(projectiles) {
        if (!projectiles) return;

        projectiles.forEach(proj => {
            this.ctx.save();

            // Enhanced projectile trail effect
            const speed = proj.vx ? Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) : 100;
            const trailLength = Math.min(speed * 0.1, 20);

            // Trail
            if (proj.vx && proj.vy) {
                const angle = Math.atan2(proj.vy, proj.vx);
                const trailGradient = this.ctx.createLinearGradient(
                    proj.x - Math.cos(angle) * trailLength,
                    proj.y - Math.sin(angle) * trailLength,
                    proj.x, proj.y
                );
                trailGradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
                trailGradient.addColorStop(1, 'rgba(255, 100, 0, 0.8)');

                this.ctx.strokeStyle = trailGradient;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(proj.x - Math.cos(angle) * trailLength,
                               proj.y - Math.sin(angle) * trailLength);
                this.ctx.lineTo(proj.x, proj.y);
                this.ctx.stroke();
            }

            // Outer glow
            const gradient = this.ctx.createRadialGradient(
                proj.x, proj.y, 0,
                proj.x, proj.y, 8
            );
            gradient.addColorStop(0, 'rgba(255, 200, 0, 1)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // Core
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, 2, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    renderInterpolationDebug(stats) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '10px monospace';

        const debugText = [
            `Entities: ${stats.entityCount}`,
            `Lerp: ${stats.lerpFactor.toFixed(3)}`,
            `Delay: ${stats.interpolationDelay}ms`,
            `Since Update: ${stats.timeSinceUpdate.toFixed(0)}ms`
        ];

        debugText.forEach((text, i) => {
            this.ctx.fillText(text, 10, 80 + i * 12);
        });

        this.ctx.restore();
    }

    renderUIOverlay(state, interpolationStats) {
        // Render any UI elements that should not be affected by camera
        if (this.showInterpolationDebug && this.renderTime) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '10px monospace';
            this.ctx.fillText(`Render: ${this.renderTime.toFixed(2)}ms`, 10, 20);
            this.ctx.restore();
        }
    }

    // Camera control methods
    setCameraSmoothing(position, zoom) {
        this.camera.setSmoothingFactors(position, zoom);
    }

    addCameraShake(intensity, duration) {
        this.camera.shake(intensity, duration);
    }

    setZoom(zoom) {
        this.camera.setZoom(zoom);
    }

    // Debug toggles
    toggleInterpolationDebug() {
        this.showInterpolationDebug = !this.showInterpolationDebug;
    }

    toggleVelocityVectors() {
        this.showVelocityVectors = !this.showVelocityVectors;
    }

    toggleMotionBlur() {
        this.motionBlurEnabled = !this.motionBlurEnabled;
    }
}