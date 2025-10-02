/**
 * Camera System for Stellar Warfare
 * Handles smooth camera following, zoom, screen shake, and coordinate conversion
 */

class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.zoom = 1.0;
    this.targetZoom = 1.0;

    // Camera settings from GDD
    this.smoothing = 0.1; // Lerp factor for smooth following
    this.lookAheadFactor = 0.3; // Predictive offset factor
    this.minZoom = 0.6;
    this.maxZoom = 1.5;
    this.zoomSpeed = 0.1;

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // World boundaries (from GDD: 3000x2000)
    this.worldWidth = 3000;
    this.worldHeight = 2000;

    // Look-ahead velocity tracking
    this.lastTargetX = 0;
    this.lastTargetY = 0;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  /**
   * Follow a target entity with smooth camera movement and look-ahead
   * @param {Object} target - Entity to follow with x, y properties
   * @param {number} deltaTime - Time since last frame in seconds
   */
  follow(target, deltaTime = 1/60) {
    if (!target) return;

    // Calculate velocity for look-ahead
    this.velocityX = (target.x - this.lastTargetX) / deltaTime;
    this.velocityY = (target.y - this.lastTargetY) / deltaTime;
    this.lastTargetX = target.x;
    this.lastTargetY = target.y;

    // Apply look-ahead offset based on velocity
    const lookAheadX = this.velocityX * this.lookAheadFactor;
    const lookAheadY = this.velocityY * this.lookAheadFactor;

    // Set target position with look-ahead
    this.targetX = target.x + lookAheadX;
    this.targetY = target.y + lookAheadY;

    // Smooth camera movement using lerp
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;

    // Smooth zoom
    this.zoom += (this.targetZoom - this.zoom) * this.zoomSpeed;

    // Clamp camera to world boundaries
    this.clampToWorld();
  }

  /**
   * Update camera position (called each frame)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime = 1/60) {
    // Update screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= deltaTime;

      // Random shake offset based on intensity
      const angle = Math.random() * Math.PI * 2;
      this.shakeOffsetX = Math.cos(angle) * this.shakeIntensity;
      this.shakeOffsetY = Math.sin(angle) * this.shakeIntensity;

      // Decay shake intensity
      this.shakeIntensity *= 0.9;

      if (this.shakeDuration <= 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.shakeIntensity = 0;
      }
    }
  }

  /**
   * Clamp camera position to world boundaries
   */
  clampToWorld() {
    const halfWidth = (this.canvas.width / 2) / this.zoom;
    const halfHeight = (this.canvas.height / 2) / this.zoom;

    this.x = Math.max(halfWidth, Math.min(this.worldWidth - halfWidth, this.x));
    this.y = Math.max(halfHeight, Math.min(this.worldHeight - halfHeight, this.y));
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - X position in world space
   * @param {number} worldY - Y position in world space
   * @returns {Object} Screen coordinates {x, y}
   */
  worldToScreen(worldX, worldY) {
    const screenX = (worldX - this.x) * this.zoom + this.canvas.width / 2 + this.shakeOffsetX;
    const screenY = (worldY - this.y) * this.zoom + this.canvas.height / 2 + this.shakeOffsetY;

    return { x: screenX, y: screenY };
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - X position on screen
   * @param {number} screenY - Y position on screen
   * @returns {Object} World coordinates {x, y}
   */
  screenToWorld(screenX, screenY) {
    const worldX = (screenX - this.canvas.width / 2 - this.shakeOffsetX) / this.zoom + this.x;
    const worldY = (screenY - this.canvas.height / 2 - this.shakeOffsetY) / this.zoom + this.y;

    return { x: worldX, y: worldY };
  }

  /**
   * Set zoom level
   * @param {number} zoomLevel - Target zoom level (0.6 to 1.5)
   */
  setZoom(zoomLevel) {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel));
  }

  /**
   * Zoom in
   * @param {number} amount - Amount to zoom in (default: 0.1)
   */
  zoomIn(amount = 0.1) {
    this.setZoom(this.targetZoom + amount);
  }

  /**
   * Zoom out
   * @param {number} amount - Amount to zoom out (default: 0.1)
   */
  zoomOut(amount = 0.1) {
    this.setZoom(this.targetZoom - amount);
  }

  /**
   * Reset zoom to default
   */
  resetZoom() {
    this.targetZoom = 1.0;
  }

  /**
   * Trigger screen shake effect
   * @param {number} intensity - Shake intensity in pixels
   * @param {number} duration - Shake duration in seconds
   */
  shake(intensity = 10, duration = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  /**
   * Apply camera transformation to canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  applyTransform(ctx) {
    ctx.save();

    // Translate to center of screen
    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

    // Apply zoom
    ctx.scale(this.zoom, this.zoom);

    // Translate to camera position (with shake)
    ctx.translate(-this.x + this.shakeOffsetX / this.zoom, -this.y + this.shakeOffsetY / this.zoom);
  }

  /**
   * Remove camera transformation from canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  removeTransform(ctx) {
    ctx.restore();
  }

  /**
   * Check if a world position is visible on screen
   * @param {number} worldX - X position in world space
   * @param {number} worldY - Y position in world space
   * @param {number} margin - Extra margin around screen edges
   * @returns {boolean} True if position is visible
   */
  isVisible(worldX, worldY, margin = 100) {
    const halfWidth = (this.canvas.width / 2) / this.zoom + margin;
    const halfHeight = (this.canvas.height / 2) / this.zoom + margin;

    return (
      worldX >= this.x - halfWidth &&
      worldX <= this.x + halfWidth &&
      worldY >= this.y - halfHeight &&
      worldY <= this.y + halfHeight
    );
  }

  /**
   * Get camera bounds in world space
   * @returns {Object} Bounds {left, right, top, bottom}
   */
  getBounds() {
    const halfWidth = (this.canvas.width / 2) / this.zoom;
    const halfHeight = (this.canvas.height / 2) / this.zoom;

    return {
      left: this.x - halfWidth,
      right: this.x + halfWidth,
      top: this.y - halfHeight,
      bottom: this.y + halfHeight
    };
  }

  /**
   * Smoothly transition camera to handle screen wrapping
   * @param {number} newX - New X position after wrap
   * @param {number} newY - New Y position after wrap
   */
  handleScreenWrap(newX, newY) {
    // Instantly update camera position for screen wrapping
    const deltaX = newX - this.lastTargetX;
    const deltaY = newY - this.lastTargetY;

    this.x += deltaX;
    this.y += deltaY;
    this.targetX += deltaX;
    this.targetY += deltaY;
    this.lastTargetX = newX;
    this.lastTargetY = newY;
  }

  /**
   * Set camera position directly (no smoothing)
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.lastTargetX = x;
    this.lastTargetY = y;
    this.clampToWorld();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Camera;
}
