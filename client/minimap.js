/**
 * Minimap System for Stellar Warfare
 * Displays a 200x200px minimap showing the full 3000x2000 game world
 */

class Minimap {
  constructor(worldWidth = 3000, worldHeight = 2000) {
    this.width = 200;
    this.height = 200;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Position (top-right corner with padding)
    this.padding = 20;
    this.x = 0; // Will be set based on canvas width
    this.y = this.padding;

    // Scale factors to fit world into minimap
    this.scaleX = this.width / this.worldWidth;
    this.scaleY = this.height / this.worldHeight;

    // Visual settings
    this.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.borderColor = '#00ffff';
    this.borderWidth = 2;
    this.viewportColor = 'rgba(0, 255, 255, 0.3)';
    this.viewportBorderColor = '#00ffff';

    // Entity colors
    this.playerColor = '#00ff00';
    this.enemyColor = '#ff0000';
    this.neutralColor = '#ffff00';
    this.projectileColor = '#ffffff';
    this.asteroidColor = '#888888';
    this.stationColor = '#0088ff';

    // Entity sizes on minimap
    this.playerSize = 4;
    this.enemySize = 3;
    this.stationSize = 6;
    this.asteroidSize = 2;
    this.projectileSize = 1;

    // Interactivity
    this.isHovered = false;
    this.isDragging = false;
  }

  /**
   * Update minimap position based on canvas size
   * @param {HTMLCanvasElement} canvas - Game canvas
   */
  updatePosition(canvas) {
    this.x = canvas.width - this.width - this.padding;
  }

  /**
   * Convert world coordinates to minimap coordinates
   * @param {number} worldX - X position in world space
   * @param {number} worldY - Y position in world space
   * @returns {Object} Minimap coordinates {x, y}
   */
  worldToMinimap(worldX, worldY) {
    return {
      x: this.x + worldX * this.scaleX,
      y: this.y + worldY * this.scaleY
    };
  }

  /**
   * Convert minimap coordinates to world coordinates
   * @param {number} minimapX - X position on minimap
   * @param {number} minimapY - Y position on minimap
   * @returns {Object} World coordinates {x, y}
   */
  minimapToWorld(minimapX, minimapY) {
    return {
      x: (minimapX - this.x) / this.scaleX,
      y: (minimapY - this.y) / this.scaleY
    };
  }

  /**
   * Check if a point is inside the minimap
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {boolean} True if point is inside minimap
   */
  containsPoint(x, y) {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }

  /**
   * Handle mouse move event
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {Object|null} World coordinates if clicked on minimap, null otherwise
   */
  handleMouseMove(mouseX, mouseY) {
    this.isHovered = this.containsPoint(mouseX, mouseY);

    if (this.isDragging && this.isHovered) {
      return this.minimapToWorld(mouseX, mouseY);
    }

    return null;
  }

  /**
   * Handle mouse down event
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {Object|null} World coordinates if clicked on minimap, null otherwise
   */
  handleMouseDown(mouseX, mouseY) {
    if (this.containsPoint(mouseX, mouseY)) {
      this.isDragging = true;
      return this.minimapToWorld(mouseX, mouseY);
    }

    return null;
  }

  /**
   * Handle mouse up event
   */
  handleMouseUp() {
    this.isDragging = false;
  }

  /**
   * Render the minimap
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object with x, y, zoom properties
   * @param {Array} entities - Array of entities to display
   * @param {Object} player - Player entity
   */
  render(ctx, camera, entities = [], player = null) {
    ctx.save();

    // Draw background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw border
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Draw entities
    this.renderEntities(ctx, entities, player);

    // Draw camera viewport
    this.renderViewport(ctx, camera);

    // Draw hover effect
    if (this.isHovered) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
    }

    ctx.restore();
  }

  /**
   * Render entities on the minimap
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Array} entities - Array of entities to display
   * @param {Object} player - Player entity
   */
  renderEntities(ctx, entities, player) {
    // Render different entity types
    entities.forEach(entity => {
      if (!entity || !entity.x || !entity.y) return;

      const pos = this.worldToMinimap(entity.x, entity.y);

      // Determine color and size based on entity type
      let color, size;

      switch (entity.type) {
        case 'player':
          color = this.playerColor;
          size = this.playerSize;
          break;
        case 'enemy':
        case 'ship':
          color = this.enemyColor;
          size = this.enemySize;
          break;
        case 'station':
          color = this.stationColor;
          size = this.stationSize;
          break;
        case 'asteroid':
          color = this.asteroidColor;
          size = this.asteroidSize;
          break;
        case 'projectile':
          color = this.projectileColor;
          size = this.projectileSize;
          break;
        default:
          color = this.neutralColor;
          size = 2;
      }

      // Draw entity
      ctx.fillStyle = color;
      ctx.fillRect(
        pos.x - size / 2,
        pos.y - size / 2,
        size,
        size
      );
    });

    // Draw player on top
    if (player && player.x && player.y) {
      const playerPos = this.worldToMinimap(player.x, player.y);

      // Draw player with outline
      ctx.fillStyle = this.playerColor;
      ctx.fillRect(
        playerPos.x - this.playerSize / 2,
        playerPos.y - this.playerSize / 2,
        this.playerSize,
        this.playerSize
      );

      // Draw player direction indicator
      if (player.angle !== undefined) {
        const dirLength = 8;
        const dirX = Math.cos(player.angle) * dirLength;
        const dirY = Math.sin(player.angle) * dirLength;

        ctx.strokeStyle = this.playerColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(playerPos.x, playerPos.y);
        ctx.lineTo(playerPos.x + dirX, playerPos.y + dirY);
        ctx.stroke();
      }
    }
  }

  /**
   * Render camera viewport rectangle
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object with x, y, zoom, canvas properties
   */
  renderViewport(ctx, camera) {
    if (!camera || !camera.canvas) return;

    // Calculate viewport size in world space
    const viewportWidth = camera.canvas.width / camera.zoom;
    const viewportHeight = camera.canvas.height / camera.zoom;

    // Calculate viewport position (top-left corner)
    const viewportLeft = camera.x - viewportWidth / 2;
    const viewportTop = camera.y - viewportHeight / 2;

    // Convert to minimap coordinates
    const topLeft = this.worldToMinimap(viewportLeft, viewportTop);
    const bottomRight = this.worldToMinimap(
      viewportLeft + viewportWidth,
      viewportTop + viewportHeight
    );

    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;

    // Draw viewport rectangle
    ctx.fillStyle = this.viewportColor;
    ctx.fillRect(topLeft.x, topLeft.y, width, height);

    ctx.strokeStyle = this.viewportBorderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(topLeft.x, topLeft.y, width, height);
  }

  /**
   * Render minimap with custom entity rendering function
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   * @param {Function} renderEntitiesCallback - Custom function to render entities
   */
  renderCustom(ctx, camera, renderEntitiesCallback) {
    ctx.save();

    // Draw background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw border
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Clip to minimap bounds
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.clip();

    // Call custom rendering callback
    if (renderEntitiesCallback) {
      renderEntitiesCallback(ctx, this);
    }

    // Draw camera viewport
    this.renderViewport(ctx, camera);

    // Draw hover effect
    if (this.isHovered) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
    }

    ctx.restore();
  }

  /**
   * Set custom colors
   * @param {Object} colors - Color configuration object
   */
  setColors(colors) {
    if (colors.player) this.playerColor = colors.player;
    if (colors.enemy) this.enemyColor = colors.enemy;
    if (colors.neutral) this.neutralColor = colors.neutral;
    if (colors.projectile) this.projectileColor = colors.projectile;
    if (colors.asteroid) this.asteroidColor = colors.asteroid;
    if (colors.station) this.stationColor = colors.station;
    if (colors.viewport) this.viewportColor = colors.viewport;
    if (colors.viewportBorder) this.viewportBorderColor = colors.viewportBorder;
    if (colors.border) this.borderColor = colors.border;
    if (colors.background) this.backgroundColor = colors.background;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Minimap;
}
