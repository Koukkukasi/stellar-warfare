/**
 * Entity Interpolation System
 * Provides smooth movement interpolation between network updates
 * Helps reduce stuttering for entities updated at low frequency
 */

export class EntityInterpolator {
    constructor() {
        // Store previous and current states for interpolation
        this.entityStates = new Map();

        // Interpolation settings
        this.interpolationDelay = 100; // ms - how far behind to render
        this.maxExtrapolation = 200; // ms - maximum extrapolation time
    }

    /**
     * Update entity state from server
     * @param {Object} entities - Array of entity updates from server
     * @param {number} timestamp - Server timestamp for this update
     */
    updateEntityStates(entities, timestamp = Date.now()) {
        entities.forEach(entity => {
            const id = entity.id;

            if (!this.entityStates.has(id)) {
                // First time seeing this entity
                this.entityStates.set(id, {
                    previous: null,
                    current: { ...entity, timestamp },
                    interpolated: { ...entity }
                });
            } else {
                // Update existing entity
                const state = this.entityStates.get(id);

                // Move current to previous
                state.previous = state.current;

                // Set new current
                state.current = { ...entity, timestamp };

                // Calculate velocity for extrapolation if needed
                if (state.previous) {
                    const dt = (timestamp - state.previous.timestamp) / 1000;
                    if (dt > 0) {
                        state.velocityX = (entity.x - state.previous.x) / dt;
                        state.velocityY = (entity.y - state.previous.y) / dt;
                        state.rotationVelocity = this.normalizeAngleDiff(entity.rotation - state.previous.rotation) / dt;
                    }
                }
            }
        });
    }

    /**
     * Get interpolated positions for all entities
     * @param {number} renderTime - Current render timestamp
     * @returns {Map} Map of entity IDs to interpolated positions
     */
    getInterpolatedStates(renderTime = Date.now()) {
        const interpolatedStates = new Map();
        const targetTime = renderTime - this.interpolationDelay;

        this.entityStates.forEach((state, id) => {
            if (!state.current) {
                return;
            }

            // No previous state - just use current
            if (!state.previous) {
                interpolatedStates.set(id, state.current);
                return;
            }

            const currentTime = state.current.timestamp;
            const previousTime = state.previous.timestamp;

            // Calculate interpolation factor
            let t = 0;

            if (targetTime <= previousTime) {
                // We're rendering in the past - use previous state
                interpolatedStates.set(id, state.previous);
                return;
            } else if (targetTime >= currentTime) {
                // We need to extrapolate into the future
                const extrapolationTime = Math.min(targetTime - currentTime, this.maxExtrapolation);

                if (state.velocityX !== undefined && state.velocityY !== undefined) {
                    // Extrapolate position based on velocity
                    const dt = extrapolationTime / 1000;
                    interpolatedStates.set(id, {
                        ...state.current,
                        x: state.current.x + state.velocityX * dt,
                        y: state.current.y + state.velocityY * dt,
                        rotation: state.current.rotation + (state.rotationVelocity || 0) * dt
                    });
                } else {
                    // No velocity data - just use current position
                    interpolatedStates.set(id, state.current);
                }
                return;
            } else {
                // Normal interpolation between previous and current
                t = (targetTime - previousTime) / (currentTime - previousTime);
                t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]
            }

            // Interpolate position
            const interpolated = {
                ...state.current,
                x: this.lerp(state.previous.x, state.current.x, t),
                y: this.lerp(state.previous.y, state.current.y, t),
                rotation: this.lerpAngle(state.previous.rotation, state.current.rotation, t)
            };

            // Optional: smooth velocity if provided
            if (state.current.velocityX !== undefined && state.previous.velocityX !== undefined) {
                interpolated.velocityX = this.lerp(state.previous.velocityX, state.current.velocityX, t);
                interpolated.velocityY = this.lerp(state.previous.velocityY, state.current.velocityY, t);
            }

            interpolatedStates.set(id, interpolated);
        });

        return interpolatedStates;
    }

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Angular interpolation (handles wrap-around)
     */
    lerpAngle(a, b, t) {
        let diff = b - a;

        // Normalize angle difference to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return a + diff * t;
    }

    /**
     * Normalize angle difference to [-PI, PI]
     */
    normalizeAngleDiff(diff) {
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return diff;
    }

    /**
     * Remove entity from interpolation system
     */
    removeEntity(id) {
        this.entityStates.delete(id);
    }

    /**
     * Clear all entity states
     */
    clear() {
        this.entityStates.clear();
    }
}