/**
 * Entity Interpolation System for Stellar Warfare
 * Provides smooth entity position interpolation and prediction
 * to eliminate stuttering and provide smooth visual gameplay
 */

export class InterpolationSystem {
    constructor() {
        // Store entity states with history for interpolation
        this.entities = new Map();

        // Server update tracking
        this.serverTime = 0;
        this.clientTime = 0;
        this.serverTimeOffset = 0;

        // Interpolation settings
        this.interpolationDelay = 100; // 100ms interpolation buffer
        this.maxExtrapolation = 250; // Max extrapolation time in ms
        this.positionSnapDistance = 200; // Distance to snap instead of interpolate

        // Performance settings
        this.lerpFactor = 0.15; // Smoothing factor for position updates
        this.velocityLerpFactor = 0.3; // Smoothing factor for velocity
        this.rotationLerpFactor = 0.2; // Smoothing factor for rotation

        // History management
        this.maxHistorySize = 10; // Keep last 10 states per entity
        this.lastServerUpdate = performance.now();
    }

    /**
     * Update the interpolation system with new server state
     * @param {Object} serverState - Complete server state
     * @param {number} serverTimestamp - Server timestamp
     */
    updateServerState(serverState, serverTimestamp = Date.now()) {
        this.lastServerUpdate = performance.now();
        this.serverTime = serverTimestamp;

        // Process all entities from server
        const allEntities = this.collectAllEntities(serverState);

        // Update or create entity interpolation data
        allEntities.forEach(entity => {
            this.updateEntityState(entity);
        });

        // Clean up entities that no longer exist
        this.cleanupOldEntities(allEntities);
    }

    /**
     * Collect all entities from server state
     */
    collectAllEntities(serverState) {
        const entities = [];

        // Collect players
        if (serverState.players) {
            serverState.players.forEach(player => {
                if (!player.isDead) {
                    entities.push({
                        ...player,
                        entityType: 'player',
                        uniqueId: `player_${player.id}`
                    });
                }
            });
        }

        // Collect bots
        if (serverState.bots) {
            serverState.bots.forEach(bot => {
                if (!bot.isDead) {
                    entities.push({
                        ...bot,
                        entityType: 'bot',
                        uniqueId: `bot_${bot.id}`
                    });
                }
            });
        }

        // Collect asteroids
        if (serverState.asteroids) {
            serverState.asteroids.forEach(asteroid => {
                entities.push({
                    ...asteroid,
                    entityType: 'asteroid',
                    uniqueId: `asteroid_${asteroid.id}`
                });
            });
        }

        // Collect projectiles
        if (serverState.projectiles) {
            serverState.projectiles.forEach(projectile => {
                entities.push({
                    ...projectile,
                    entityType: 'projectile',
                    uniqueId: `projectile_${projectile.id}`
                });
            });
        }

        return entities;
    }

    /**
     * Update individual entity state with interpolation data
     */
    updateEntityState(serverEntity) {
        const uniqueId = serverEntity.uniqueId;

        if (!this.entities.has(uniqueId)) {
            // New entity - initialize interpolation data
            this.entities.set(uniqueId, {
                id: uniqueId,
                type: serverEntity.entityType,
                history: [],
                current: {
                    x: serverEntity.x,
                    y: serverEntity.y,
                    vx: serverEntity.velocityX || serverEntity.vx || 0,
                    vy: serverEntity.velocityY || serverEntity.vy || 0,
                    angle: serverEntity.rotation || serverEntity.angle || 0,
                    timestamp: performance.now()
                },
                rendered: {
                    x: serverEntity.x,
                    y: serverEntity.y,
                    vx: serverEntity.velocityX || serverEntity.vx || 0,
                    vy: serverEntity.velocityY || serverEntity.vy || 0,
                    angle: serverEntity.rotation || serverEntity.angle || 0
                },
                serverData: serverEntity
            });
        } else {
            // Existing entity - add to history and update
            const entityData = this.entities.get(uniqueId);

            // Add current state to history
            entityData.history.push({...entityData.current});

            // Limit history size
            if (entityData.history.length > this.maxHistorySize) {
                entityData.history.shift();
            }

            // Calculate velocity if not provided
            const timeDelta = (performance.now() - entityData.current.timestamp) / 1000;
            const calculatedVx = timeDelta > 0 ? (serverEntity.x - entityData.current.x) / timeDelta : 0;
            const calculatedVy = timeDelta > 0 ? (serverEntity.y - entityData.current.y) / timeDelta : 0;

            // Update current state
            entityData.current = {
                x: serverEntity.x,
                y: serverEntity.y,
                vx: serverEntity.velocityX || serverEntity.vx || calculatedVx,
                vy: serverEntity.velocityY || serverEntity.vy || calculatedVy,
                angle: serverEntity.rotation || serverEntity.angle || 0,
                timestamp: performance.now()
            };

            // Store server data for rendering properties
            entityData.serverData = serverEntity;

            // Check for position snap (teleport)
            const distance = Math.sqrt(
                Math.pow(entityData.rendered.x - serverEntity.x, 2) +
                Math.pow(entityData.rendered.y - serverEntity.y, 2)
            );

            if (distance > this.positionSnapDistance) {
                // Snap to new position
                entityData.rendered.x = serverEntity.x;
                entityData.rendered.y = serverEntity.y;
                entityData.rendered.vx = entityData.current.vx;
                entityData.rendered.vy = entityData.current.vy;
            }
        }
    }

    /**
     * Clean up entities that no longer exist on server
     */
    cleanupOldEntities(currentEntities) {
        const currentIds = new Set(currentEntities.map(e => e.uniqueId));

        for (const [id, _] of this.entities) {
            if (!currentIds.has(id)) {
                this.entities.delete(id);
            }
        }
    }

    /**
     * Interpolate all entities for current frame
     * @param {number} deltaTime - Time since last frame in seconds
     * @returns {Array} Interpolated entities ready for rendering
     */
    interpolate(deltaTime) {
        const currentTime = performance.now();
        const timeSinceUpdate = currentTime - this.lastServerUpdate;
        const interpolatedEntities = [];

        for (const [id, entityData] of this.entities) {
            // Skip player entity if it's the local player (handled separately)
            if (entityData.skipInterpolation) {
                continue;
            }

            // Determine interpolation method based on entity type
            let interpolatedPosition;

            switch (entityData.type) {
                case 'projectile':
                    // Projectiles use pure extrapolation for smooth movement
                    interpolatedPosition = this.extrapolatePosition(entityData, deltaTime);
                    break;

                case 'asteroid':
                    // Asteroids use slow interpolation (they move slowly)
                    interpolatedPosition = this.smoothInterpolate(entityData, deltaTime, 0.05);
                    break;

                case 'player':
                case 'bot':
                    // Ships use advanced interpolation with prediction
                    if (timeSinceUpdate < this.interpolationDelay) {
                        // Recent update - use interpolation
                        interpolatedPosition = this.smoothInterpolate(entityData, deltaTime, this.lerpFactor);
                    } else if (timeSinceUpdate < this.maxExtrapolation) {
                        // Older update - use extrapolation
                        interpolatedPosition = this.extrapolatePosition(entityData, deltaTime);
                    } else {
                        // Very old update - just use last known position
                        interpolatedPosition = this.smoothInterpolate(entityData, deltaTime, 0.02);
                    }
                    break;

                default:
                    interpolatedPosition = this.smoothInterpolate(entityData, deltaTime, this.lerpFactor);
            }

            // Update rendered state
            entityData.rendered = interpolatedPosition;

            // Create entity object for renderer
            const renderEntity = {
                ...entityData.serverData,
                x: interpolatedPosition.x,
                y: interpolatedPosition.y,
                angle: interpolatedPosition.angle,
                vx: interpolatedPosition.vx,
                vy: interpolatedPosition.vy,
                type: this.mapEntityTypeToRenderType(entityData.type)
            };

            interpolatedEntities.push(renderEntity);
        }

        return interpolatedEntities;
    }

    /**
     * Smooth interpolation using lerp
     */
    smoothInterpolate(entityData, deltaTime, lerpFactor) {
        const target = entityData.current;
        const current = entityData.rendered;

        // Smooth position interpolation
        const newX = this.lerp(current.x, target.x, lerpFactor);
        const newY = this.lerp(current.y, target.y, lerpFactor);

        // Smooth velocity interpolation
        const newVx = this.lerp(current.vx, target.vx, this.velocityLerpFactor);
        const newVy = this.lerp(current.vy, target.vy, this.velocityLerpFactor);

        // Smooth rotation interpolation (handling angle wrap)
        const newAngle = this.lerpAngle(current.angle, target.angle, this.rotationLerpFactor);

        return {
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            angle: newAngle
        };
    }

    /**
     * Extrapolate position based on velocity
     */
    extrapolatePosition(entityData, deltaTime) {
        const current = entityData.rendered;

        // Apply velocity-based prediction
        const predictedX = current.x + (current.vx * deltaTime);
        const predictedY = current.y + (current.vy * deltaTime);

        // Blend with target position to prevent drift
        const target = entityData.current;
        const blendFactor = 0.05; // Small blend to prevent drift

        return {
            x: this.lerp(predictedX, target.x, blendFactor),
            y: this.lerp(predictedY, target.y, blendFactor),
            vx: current.vx,
            vy: current.vy,
            angle: this.lerpAngle(current.angle, target.angle, this.rotationLerpFactor)
        };
    }

    /**
     * Linear interpolation
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    /**
     * Angular interpolation (handles angle wrapping)
     */
    lerpAngle(start, end, factor) {
        let diff = end - start;

        // Wrap angle difference to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return start + diff * factor;
    }

    /**
     * Map entity type to renderer type
     */
    mapEntityTypeToRenderType(entityType) {
        switch (entityType) {
            case 'player':
            case 'bot':
                return 'ship';
            case 'asteroid':
                return 'asteroid';
            case 'projectile':
                return 'projectile';
            default:
                return entityType;
        }
    }

    /**
     * Mark an entity to skip interpolation (e.g., local player)
     */
    skipEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.skipInterpolation = true;
        }
    }

    /**
     * Get interpolated state for a specific entity
     */
    getEntityState(entityId) {
        const entity = this.entities.get(entityId);
        return entity ? entity.rendered : null;
    }

    /**
     * Adjust interpolation settings for network conditions
     */
    adjustForLatency(latency) {
        // Adjust interpolation delay based on network latency
        if (latency < 50) {
            this.interpolationDelay = 100;
            this.lerpFactor = 0.15;
        } else if (latency < 100) {
            this.interpolationDelay = 150;
            this.lerpFactor = 0.12;
        } else if (latency < 200) {
            this.interpolationDelay = 200;
            this.lerpFactor = 0.10;
        } else {
            this.interpolationDelay = 250;
            this.lerpFactor = 0.08;
        }
    }

    /**
     * Debug: Get interpolation statistics
     */
    getStats() {
        return {
            entityCount: this.entities.size,
            interpolationDelay: this.interpolationDelay,
            lerpFactor: this.lerpFactor,
            timeSinceUpdate: performance.now() - this.lastServerUpdate
        };
    }
}

/**
 * Camera Smoothing System
 * Provides smooth camera movement and zoom
 */
export class CameraSystem {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 };
        this.zoom = 1;
        this.targetZoom = 1;

        // Smoothing factors
        this.positionLerpFactor = 0.1;
        this.zoomLerpFactor = 0.1;

        // Camera shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeOffset = { x: 0, y: 0 };
    }

    /**
     * Update camera target
     */
    setTarget(x, y) {
        this.targetPosition.x = x;
        this.targetPosition.y = y;
    }

    /**
     * Update camera zoom
     */
    setZoom(zoom) {
        this.targetZoom = Math.max(0.5, Math.min(2, zoom));
    }

    /**
     * Update camera with smooth interpolation
     */
    update(deltaTime) {
        // Smooth position interpolation
        this.position.x += (this.targetPosition.x - this.position.x) * this.positionLerpFactor;
        this.position.y += (this.targetPosition.y - this.position.y) * this.positionLerpFactor;

        // Smooth zoom interpolation
        this.zoom += (this.targetZoom - this.zoom) * this.zoomLerpFactor;

        // Update camera shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;

            // Reduce intensity over time
            this.shakeIntensity *= 0.95;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }
    }

    /**
     * Get final camera position with shake applied
     */
    getPosition() {
        return {
            x: this.position.x + this.shakeOffset.x,
            y: this.position.y + this.shakeOffset.y
        };
    }

    /**
     * Add camera shake effect
     */
    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    /**
     * Set smoothing factors
     */
    setSmoothingFactors(position, zoom) {
        this.positionLerpFactor = Math.max(0.01, Math.min(1, position));
        this.zoomLerpFactor = Math.max(0.01, Math.min(1, zoom));
    }
}