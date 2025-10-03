export class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;

        // Camera
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetX: 0,
            targetY: 0
        };

        // Visual settings
        this.showGrid = true;
        this.gridSize = 50;
        this.starField = this.generateStarField(200);
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
                brightness: Math.random() * 0.5 + 0.5
            });
        }
        return stars;
    }

    render(state) {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Update camera to follow player
        if (state.player) {
            this.camera.targetX = state.player.x;
            this.camera.targetY = state.player.y;

            // Smooth camera movement
            this.camera.x += (this.camera.targetX - this.camera.x) * 0.1;
            this.camera.y += (this.camera.targetY - this.camera.y) * 0.1;
        }

        // Save context state
        this.ctx.save();

        // Apply camera transform
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Render star field
        this.renderStarField();

        // Render grid
        if (this.showGrid) {
            this.renderGrid();
        }

        // Render world border
        this.renderWorldBorder();

        // Render entities
        this.renderEntities(state.entities);

        // Render projectiles
        this.renderProjectiles(state.projectiles);

        // Render collectibles
        this.renderCollectibles(state.collectibles);

        // Render explosions
        this.renderExplosions(state.explosions);

        // Render floating texts (in world space)
        this.renderFloatingTexts(state.floatingTexts);

        // Render player
        if (state.player) {
            this.renderShip(state.player, true);
        }

        // Restore context state
        this.ctx.restore();
    }

    renderStarField() {
        this.starField.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    renderGrid() {
        const gridColor = 'rgba(0, 255, 0, 0.1)';
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

        const startX = Math.floor((this.camera.x - this.canvas.width / 2) / this.gridSize) * this.gridSize;
        const startY = Math.floor((this.camera.y - this.canvas.height / 2) / this.gridSize) * this.gridSize;
        const endX = this.camera.x + this.canvas.width / 2;
        const endY = this.camera.y + this.canvas.height / 2;

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

    renderWorldBorder() {
        // World dimensions: 4000x3000 (from server game.js)
        const worldWidth = 4000;
        const worldHeight = 3000;

        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 5;
        this.ctx.setLineDash([20, 10]);

        this.ctx.strokeRect(0, 0, worldWidth, worldHeight);

        this.ctx.setLineDash([]);
    }

    renderEntities(entities) {
        if (!entities) return;

        entities.forEach(entity => {
            if (entity.type === 'ship') {
                this.renderShip(entity, false);
            } else if (entity.type === 'asteroid') {
                this.renderAsteroid(entity);
            }
        });
    }

    renderAsteroid(asteroid) {
        this.ctx.save();
        this.ctx.translate(asteroid.x, asteroid.y);
        this.ctx.rotate(asteroid.rotation || 0);

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

        // Cockpit
        this.ctx.beginPath();
        this.ctx.arc(5, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Engine glow
        this.ctx.fillStyle = '#00aaff';
        this.ctx.globalAlpha = 0.6;
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

        // Weapon mounts
        this.ctx.strokeRect(-3, -10, 8, 4);
        this.ctx.strokeRect(-3, 6, 8, 4);

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

        // Bridge
        this.ctx.strokeRect(-5, -6, 10, 12);

        // Weapon turrets
        this.ctx.beginPath();
        this.ctx.arc(5, -8, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(5, 8, 2, 0, Math.PI * 2);
        this.ctx.fill();

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

        // Health
        const healthWidth = (health / 100) * width;
        this.ctx.fillStyle = '#00ff00';
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

            // Different rendering for secondary projectiles
            if (proj.isSecondary) {
                // Larger, blue secondary projectile
                const gradient = this.ctx.createRadialGradient(
                    proj.x, proj.y, 0,
                    proj.x, proj.y, 8
                );
                gradient.addColorStop(0, 'rgba(0, 100, 255, 1)');
                gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
                this.ctx.fill();

                // Core
                this.ctx.fillStyle = '#00ffff';
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Standard projectile trail effect
                const gradient = this.ctx.createRadialGradient(
                    proj.x, proj.y, 0,
                    proj.x, proj.y, 5
                );
                gradient.addColorStop(0, 'rgba(255, 100, 0, 1)');
                gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
                this.ctx.fill();

                // Core
                this.ctx.fillStyle = '#ffff00';
                this.ctx.beginPath();
                this.ctx.arc(proj.x, proj.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    renderCollectibles(collectibles) {
        if (!collectibles) return;

        collectibles.forEach(collectible => {
            this.ctx.save();

            // Pulsing glow effect
            const time = Date.now() / 1000;
            const pulse = 0.8 + Math.sin(time * 3) * 0.2;

            // Outer glow
            const gradient = this.ctx.createRadialGradient(
                collectible.x, collectible.y, 0,
                collectible.x, collectible.y, collectible.radius * 2
            );
            gradient.addColorStop(0, collectible.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = pulse * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(collectible.x, collectible.y, collectible.radius * 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner circle
            this.ctx.globalAlpha = pulse;
            this.ctx.fillStyle = collectible.color;
            this.ctx.beginPath();
            this.ctx.arc(collectible.x, collectible.y, collectible.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Icon/symbol based on type
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            const symbols = {
                'triple-shot': '⚡',
                'rapid-fire': '≡',
                'double-damage': '★',
                'piercing': '»',
                'homing': '⊕'
            };

            this.ctx.fillText(symbols[collectible.type] || '?', collectible.x, collectible.y);

            this.ctx.restore();
        });
    }

    renderExplosions(explosions) {
        if (!explosions) return;

        explosions.forEach(explosion => {
            this.ctx.save();

            // Calculate explosion progress (0 to 1)
            const progress = explosion.age / 0.5; // 0.5 second lifetime

            // Expanding ring effect
            const currentRadius = explosion.radius * (0.3 + progress * 0.7);
            const alpha = 1 - progress; // Fade out over time

            // Outer shockwave
            const gradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, currentRadius * 0.5,
                explosion.x, explosion.y, currentRadius
            );
            gradient.addColorStop(0, `rgba(255, 150, 0, ${alpha * 0.8})`);
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha})`);
            gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, currentRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner flash
            const flashRadius = explosion.radius * 0.3 * (1 - progress);
            this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.9})`;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, flashRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Ring border
            this.ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, currentRadius, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    renderFloatingTexts(floatingTexts) {
        if (!floatingTexts) return;

        if (floatingTexts.length > 0) {
            console.log('[Renderer] Rendering floating texts:', floatingTexts.length, floatingTexts[0]);
        }

        floatingTexts.forEach(text => {
            // Calculate age and progress
            const age = (Date.now() - text.createdAt) / 1000; // Age in seconds
            const progress = age / text.lifetime; // 0 to 1

            // Skip if too old (should be filtered server-side but just in case)
            if (progress >= 1) return;

            // Text rises up and fades out
            const riseDistance = 50; // Pixels to rise
            const currentY = text.y - (riseDistance * progress);
            const alpha = Math.max(0, 1 - progress); // Fade out

            // Already in camera space, just render directly
            this.ctx.save();

            // Render text with outline for better visibility
            this.ctx.font = 'bold 24px monospace'; // Larger font
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Black outline
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(text.text, text.x, currentY);

            // Colored fill - convert hex to rgba
            let r, g, b;
            if (text.color && text.color.startsWith('#')) {
                // Convert hex to RGB
                const hex = text.color.substring(1);
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            } else {
                // Default to white
                r = g = b = 255;
            }
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            this.ctx.fillText(text.text, text.x, currentY);

            this.ctx.restore();
        });
    }
}
