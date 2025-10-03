/**
 * Stellar Warfare Particle System
 * High-performance particle effects for combat and visual feedback
 *
 * Features:
 * - Object pooling for performance
 * - Multiple particle types (explosions, sparks, debris, smoke)
 * - GPU-accelerated rendering
 * - Configurable emitters and behaviors
 */

class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 1;
        this.life = 1;
        this.maxLife = 1;
        this.color = '#00ff41';
        this.alpha = 1;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.scale = 1;
        this.friction = 0.98;
        this.gravity = 0;
        this.fade = true;
        this.shrink = false;
        this.glow = false;
        this.trail = false;
        this.trailLength = 5;
        this.trailPositions = [];
        this.active = false;
    }

    init(config) {
        Object.assign(this, config);
        this.life = this.maxLife;
        this.active = true;
        this.trailPositions = [];
        return this;
    }

    update(deltaTime) {
        if (!this.active) return;

        // Update trail positions
        if (this.trail) {
            this.trailPositions.push({ x: this.x, y: this.y, alpha: this.alpha });
            if (this.trailPositions.length > this.trailLength) {
                this.trailPositions.shift();
            }
        }

        // Apply physics
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;

        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;

        // Update life
        this.life -= deltaTime;

        // Update visual properties based on life
        const lifeRatio = this.life / this.maxLife;

        if (this.fade) {
            this.alpha = lifeRatio;
        }

        if (this.shrink) {
            this.scale = lifeRatio;
        }

        // Deactivate if dead
        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();

        // Render trail if enabled
        if (this.trail && this.trailPositions.length > 0) {
            for (let i = 0; i < this.trailPositions.length; i++) {
                const pos = this.trailPositions[i];
                const trailAlpha = (i / this.trailPositions.length) * this.alpha * 0.5;

                ctx.globalAlpha = trailAlpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, this.size * this.scale * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Apply transformations
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;

        // Apply glow effect
        if (this.glow) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
        }

        // Draw particle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * this.scale, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        if (this.glow) {
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}

class ParticlePool {
    constructor(size = 1000) {
        this.pool = [];
        this.active = [];

        // Pre-allocate particles
        for (let i = 0; i < size; i++) {
            this.pool.push(new Particle());
        }
    }

    get() {
        let particle = this.pool.pop();
        if (!particle) {
            particle = new Particle();
        }
        this.active.push(particle);
        return particle;
    }

    release(particle) {
        particle.active = false;
        const index = this.active.indexOf(particle);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.pool.push(particle);
        }
    }

    update(deltaTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const particle = this.active[i];
            particle.update(deltaTime);

            if (!particle.active) {
                this.release(particle);
            }
        }
    }

    render(ctx) {
        for (const particle of this.active) {
            particle.render(ctx);
        }
    }

    clear() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }
}

class ParticleEmitter {
    constructor(config = {}) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 0;
        this.height = config.height || 0;
        this.rate = config.rate || 10; // Particles per second
        this.maxParticles = config.maxParticles || 100;
        this.particleConfig = config.particleConfig || {};
        this.active = false;
        this.accumulated = 0;
        this.emitted = 0;
        this.duration = config.duration || Infinity;
        this.elapsed = 0;
    }

    start() {
        this.active = true;
        this.accumulated = 0;
        this.emitted = 0;
        this.elapsed = 0;
    }

    stop() {
        this.active = false;
    }

    update(deltaTime, pool) {
        if (!this.active) return;

        this.elapsed += deltaTime;

        if (this.elapsed >= this.duration) {
            this.stop();
            return;
        }

        this.accumulated += this.rate * deltaTime;

        while (this.accumulated >= 1 && this.emitted < this.maxParticles) {
            this.emit(pool);
            this.accumulated -= 1;
            this.emitted++;
        }
    }

    emit(pool) {
        const particle = pool.get();

        // Random position within emitter bounds
        const x = this.x + (Math.random() - 0.5) * this.width;
        const y = this.y + (Math.random() - 0.5) * this.height;

        // Apply particle configuration with some randomization
        const config = {
            x,
            y,
            ...this.getRandomizedConfig()
        };

        particle.init(config);
    }

    getRandomizedConfig() {
        const config = {};

        for (const [key, value] of Object.entries(this.particleConfig)) {
            if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
                // Random range
                config[key] = value.min + Math.random() * (value.max - value.min);
            } else if (Array.isArray(value)) {
                // Random selection from array
                config[key] = value[Math.floor(Math.random() * value.length)];
            } else {
                // Direct value
                config[key] = value;
            }
        }

        return config;
    }
}

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pool = new ParticlePool(2000);
        this.emitters = [];
        this.lastTime = performance.now();
    }

    // Predefined particle effects
    createExplosion(x, y, config = {}) {
        const defaults = {
            count: 30,
            color: '#ff4400',
            secondaryColor: '#ffaa00',
            size: 3,
            speed: 200,
            life: 0.8,
            gravity: 50,
            glow: true
        };

        const settings = { ...defaults, ...config };

        // Core explosion particles
        for (let i = 0; i < settings.count; i++) {
            const angle = (Math.PI * 2 * i) / settings.count + Math.random() * 0.5;
            const speed = settings.speed * (0.5 + Math.random() * 0.5);

            const particle = this.pool.get();
            particle.init({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: settings.size * (0.5 + Math.random() * 1),
                maxLife: settings.life * (0.5 + Math.random() * 0.5),
                color: Math.random() > 0.5 ? settings.color : settings.secondaryColor,
                friction: 0.95,
                gravity: settings.gravity,
                fade: true,
                shrink: true,
                glow: settings.glow
            });
        }

        // Spark particles
        for (let i = 0; i < settings.count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = settings.speed * 1.5 * (0.5 + Math.random() * 0.5);

            const particle = this.pool.get();
            particle.init({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1,
                maxLife: settings.life * 1.5,
                color: '#ffffff',
                friction: 0.9,
                gravity: settings.gravity * 0.5,
                fade: true,
                trail: true,
                trailLength: 10,
                glow: true
            });
        }
    }

    createLaserHit(x, y, angle, config = {}) {
        const defaults = {
            count: 15,
            color: '#00ff41',
            size: 2,
            speed: 100,
            life: 0.4
        };

        const settings = { ...defaults, ...config };

        // Impact sparks
        for (let i = 0; i < settings.count; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;
            const speed = settings.speed * (0.5 + Math.random() * 0.5);

            const particle = this.pool.get();
            particle.init({
                x,
                y,
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                size: settings.size * (0.5 + Math.random() * 0.5),
                maxLife: settings.life,
                color: settings.color,
                friction: 0.9,
                fade: true,
                shrink: true,
                glow: true
            });
        }
    }

    createPowerupCollect(x, y, config = {}) {
        const defaults = {
            count: 20,
            color: '#ff00ff',
            size: 3,
            speed: 150,
            life: 1
        };

        const settings = { ...defaults, ...config };

        // Spiral effect
        for (let i = 0; i < settings.count; i++) {
            const angle = (Math.PI * 2 * i) / settings.count;
            const speed = settings.speed;

            const particle = this.pool.get();
            particle.init({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: settings.size,
                maxLife: settings.life,
                color: settings.color,
                friction: 0.92,
                fade: true,
                rotationSpeed: Math.PI * 2,
                trail: true,
                trailLength: 8,
                glow: true
            });
        }

        // Center burst
        for (let i = 0; i < settings.count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = settings.speed * 0.3;

            const particle = this.pool.get();
            particle.init({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: settings.size * 2,
                maxLife: settings.life * 0.5,
                color: '#ffffff',
                friction: 0.8,
                fade: true,
                shrink: true,
                glow: true
            });
        }
    }

    createThrusterFlame(x, y, angle, config = {}) {
        const defaults = {
            count: 3,
            color: '#00d4ff',
            secondaryColor: '#ffffff',
            size: 4,
            speed: 50,
            life: 0.3,
            spread: 0.3
        };

        const settings = { ...defaults, ...config };

        for (let i = 0; i < settings.count; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * settings.spread;
            const speed = settings.speed * (0.8 + Math.random() * 0.4);

            const particle = this.pool.get();
            particle.init({
                x,
                y,
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                size: settings.size * (0.5 + Math.random() * 0.5),
                maxLife: settings.life * (0.8 + Math.random() * 0.4),
                color: Math.random() > 0.3 ? settings.color : settings.secondaryColor,
                friction: 0.9,
                fade: true,
                shrink: true,
                glow: true
            });
        }
    }

    createShieldHit(x, y, config = {}) {
        const defaults = {
            count: 8,
            color: '#00ffff',
            size: 5,
            speed: 30,
            life: 0.5
        };

        const settings = { ...defaults, ...config };

        // Hexagon pattern
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;

            const particle = this.pool.get();
            particle.init({
                x: x + Math.cos(angle) * 20,
                y: y + Math.sin(angle) * 20,
                vx: Math.cos(angle) * settings.speed,
                vy: Math.sin(angle) * settings.speed,
                size: settings.size,
                maxLife: settings.life,
                color: settings.color,
                friction: 0.85,
                fade: true,
                scale: 2,
                shrink: true,
                glow: true
            });
        }

        // Center flash
        const particle = this.pool.get();
        particle.init({
            x,
            y,
            vx: 0,
            vy: 0,
            size: settings.size * 4,
            maxLife: settings.life * 0.5,
            color: '#ffffff',
            fade: true,
            shrink: true,
            glow: true
        });
    }

    createDebris(x, y, config = {}) {
        const defaults = {
            count: 10,
            color: '#666666',
            size: 3,
            speed: 100,
            life: 2,
            gravity: 100
        };

        const settings = { ...defaults, ...config };

        for (let i = 0; i < settings.count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = settings.speed * (0.3 + Math.random() * 0.7);

            const particle = this.pool.get();
            particle.init({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: settings.size * (0.5 + Math.random() * 1),
                maxLife: settings.life * (0.5 + Math.random() * 0.5),
                color: settings.color,
                friction: 0.98,
                gravity: settings.gravity,
                rotationSpeed: (Math.random() - 0.5) * Math.PI * 4,
                fade: true
            });
        }
    }

    createSmoke(x, y, config = {}) {
        const defaults = {
            count: 5,
            color: '#333333',
            size: 8,
            speed: 20,
            life: 1.5
        };

        const settings = { ...defaults, ...config };

        for (let i = 0; i < settings.count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = settings.speed * (0.5 + Math.random() * 0.5);

            const particle = this.pool.get();
            particle.init({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20, // Rise up
                size: settings.size * (0.8 + Math.random() * 0.4),
                maxLife: settings.life * (0.8 + Math.random() * 0.4),
                color: settings.color,
                friction: 0.95,
                fade: true,
                scale: 0.5,
                alpha: 0.5
            });
        }
    }

    addEmitter(emitter) {
        this.emitters.push(emitter);
        return emitter;
    }

    removeEmitter(emitter) {
        const index = this.emitters.indexOf(emitter);
        if (index !== -1) {
            this.emitters.splice(index, 1);
        }
    }

    update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update emitters
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            emitter.update(deltaTime, this.pool);

            if (!emitter.active && emitter.duration !== Infinity) {
                this.emitters.splice(i, 1);
            }
        }

        // Update particles
        this.pool.update(deltaTime);
    }

    render() {
        this.pool.render(this.ctx);
    }

    clear() {
        this.pool.clear();
        this.emitters = [];
    }

    getActiveParticleCount() {
        return this.pool.active.length;
    }
}

// Export for use in other modules
export { ParticleSystem, ParticleEmitter, Particle, ParticlePool };