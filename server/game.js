const Bot = require('./bot');
const SpatialGrid = require('./spatial-grid');
const { getShipConfig, getDefaultShip } = require('./ship-types');

class Game {
  constructor(id, io, tickRate = 60) {
    this.id = id;
    this.io = io;
    this.tickRate = tickRate;
    this.tickInterval = 1000 / tickRate;
    this.tickTimer = null;
    this.lastTickTime = Date.now();

    // Game state
    this.players = new Map(); // socketId -> player object
    this.bots = new Map(); // botId -> bot object
    this.projectiles = [];
    this.asteroids = [];
    this.powerups = [];

    // Game config - Full HD resolution (not 4K)
    this.worldSize = { width: 1920, height: 1080 };
    this.maxPlayers = 10;
    this.gameStartTime = null;
    this.isRunning = false;

    // CRASH PREVENTION: Resource limits
    this.MAX_PROJECTILES = 100; // Prevent memory overflow (reduced for Full HD)
    this.MAX_ASTEROIDS = 50; // Reduced for smaller map
    this.errorCount = 0;
    this.MAX_ERRORS = 10; // Auto-shutdown if too many errors

    // PERFORMANCE: Spatial grid for collision detection (O(n²) → O(n))
    this.spatialGrid = new SpatialGrid(this.worldSize.width, this.worldSize.height, 200);

    // Initialize game world
    this.initializeWorld();
  }

  initializeWorld() {
    // Spawn asteroids (reduced for smaller Full HD map)
    const asteroidCount = 30;
    for (let i = 0; i < asteroidCount; i++) {
      this.asteroids.push({
        id: `asteroid_${i}`,
        x: Math.random() * this.worldSize.width,
        y: Math.random() * this.worldSize.height,
        radius: 20 + Math.random() * 40,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: (Math.random() - 0.5) * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05
      });
    }
  }

  start() {
    this.isRunning = true;
    this.gameStartTime = Date.now();
    this.lastTickTime = Date.now();

    // Start game loop
    this.tickTimer = setInterval(() => this.tick(), this.tickInterval);

    console.log(`Game ${this.id} started`);
  }

  stop() {
    this.isRunning = false;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    console.log(`Game ${this.id} stopped`);
  }

  tick() {
    // CRASH PREVENTION: Wrap entire tick in try-catch
    try {
      if (!this.isRunning) return;

      const now = Date.now();
      const deltaTime = (now - this.lastTickTime) / 1000; // Convert to seconds

      // CRASH PREVENTION: Validate deltaTime
      if (deltaTime > 1 || deltaTime < 0 || isNaN(deltaTime)) {
        console.warn(`[Game ${this.id}] Invalid deltaTime: ${deltaTime}, skipping tick`);
        this.lastTickTime = now;
        return;
      }

      this.lastTickTime = now;

      // Update bots AI
      this.bots.forEach(bot => {
        try {
          if (bot && bot.update) {
            bot.update(this.getGameState(), deltaTime);
          }
        } catch (err) {
          console.error(`[Game ${this.id}] Bot update error:`, err.message);
          this.errorCount++;
        }
      });

      // Update player physics
      this.players.forEach(player => {
        try {
          if (player && !player.isDead) {
            this.updatePlayerPhysics(player, deltaTime);
          }
        } catch (err) {
          console.error(`[Game ${this.id}] Player physics error:`, err.message);
          this.errorCount++;
        }
      });

      // Update bot physics
      this.bots.forEach(bot => {
        try {
          if (bot && !bot.isDead) {
            this.updatePlayerPhysics(bot, deltaTime);
          }
        } catch (err) {
          console.error(`[Game ${this.id}] Bot physics error:`, err.message);
          this.errorCount++;
        }
      });

      // Update projectiles
      this.updateProjectiles(deltaTime);

      // Update asteroids
      this.updateAsteroids(deltaTime);

      // Check collisions
      this.checkCollisions();

      // Clean up dead entities
      this.cleanupDeadEntities();

      // Broadcast game state to all players
      this.broadcastGameState();

      // CRASH PREVENTION: Check if too many errors occurred
      if (this.errorCount > this.MAX_ERRORS) {
        console.error(`[Game ${this.id}] Too many errors (${this.errorCount}), shutting down game`);
        this.stop();
      }

    } catch (err) {
      console.error(`[Game ${this.id}] Critical tick error:`, err);
      this.errorCount++;

      // Emergency shutdown if critical error
      if (this.errorCount > this.MAX_ERRORS) {
        console.error(`[Game ${this.id}] Emergency shutdown due to repeated errors`);
        this.stop();
      }
    }
  }

  updatePlayerPhysics(entity, deltaTime) {
    // Calculate acceleration based on WASD inputs
    let ax = 0;
    let ay = 0;
    const accelForce = 400;

    if (entity.inputs) {
      if (entity.inputs.forward) {
        ax += Math.cos(entity.rotation) * accelForce;
        ay += Math.sin(entity.rotation) * accelForce;
      }
      if (entity.inputs.backward) {
        ax -= Math.cos(entity.rotation) * accelForce * 0.5;
        ay -= Math.sin(entity.rotation) * accelForce * 0.5;
      }
      if (entity.inputs.left) {
        ax -= Math.cos(entity.rotation + Math.PI / 2) * accelForce * 0.7;
        ay -= Math.sin(entity.rotation + Math.PI / 2) * accelForce * 0.7;
      }
      if (entity.inputs.right) {
        ax += Math.cos(entity.rotation + Math.PI / 2) * accelForce * 0.7;
        ay += Math.sin(entity.rotation + Math.PI / 2) * accelForce * 0.7;
      }
      if (entity.inputs.brake) {
        entity.velocityX *= 0.9;
        entity.velocityY *= 0.9;
      }
    }

    // Apply acceleration
    entity.velocityX += ax * deltaTime;
    entity.velocityY += ay * deltaTime;

    // Apply drag
    const drag = 0.98;
    entity.velocityX *= drag;
    entity.velocityY *= drag;

    // Limit max speed
    const speed = Math.sqrt(entity.velocityX ** 2 + entity.velocityY ** 2);
    if (speed > entity.maxSpeed) {
      entity.velocityX = (entity.velocityX / speed) * entity.maxSpeed;
      entity.velocityY = (entity.velocityY / speed) * entity.maxSpeed;
    }

    // Update position
    entity.x += entity.velocityX * deltaTime * 60;
    entity.y += entity.velocityY * deltaTime * 60;

    // Wrap around world boundaries
    if (entity.x < 0) entity.x += this.worldSize.width;
    if (entity.x > this.worldSize.width) entity.x -= this.worldSize.width;
    if (entity.y < 0) entity.y += this.worldSize.height;
    if (entity.y > this.worldSize.height) entity.y -= this.worldSize.height;

    // Update weapon cooldown
    if (entity.weaponCooldown > 0) {
      entity.weaponCooldown -= deltaTime;
    }
  }

  updateProjectiles(deltaTime) {
    this.projectiles = this.projectiles.filter(projectile => {
      // Update position
      projectile.x += projectile.velocityX * deltaTime * 60;
      projectile.y += projectile.velocityY * deltaTime * 60;

      // Decrease lifetime
      projectile.lifetime -= deltaTime;

      // Remove if expired or out of bounds
      return projectile.lifetime > 0 &&
             projectile.x >= 0 && projectile.x <= this.worldSize.width &&
             projectile.y >= 0 && projectile.y <= this.worldSize.height;
    });
  }

  updateAsteroids(deltaTime) {
    this.asteroids.forEach(asteroid => {
      asteroid.x += asteroid.velocityX * deltaTime * 60;
      asteroid.y += asteroid.velocityY * deltaTime * 60;
      asteroid.rotation += asteroid.rotationSpeed;

      // Wrap around boundaries
      if (asteroid.x < -asteroid.radius) asteroid.x = this.worldSize.width + asteroid.radius;
      if (asteroid.x > this.worldSize.width + asteroid.radius) asteroid.x = -asteroid.radius;
      if (asteroid.y < -asteroid.radius) asteroid.y = this.worldSize.height + asteroid.radius;
      if (asteroid.y > this.worldSize.height + asteroid.radius) asteroid.y = -asteroid.radius;
    });
  }

  checkCollisions() {
    // PERFORMANCE OPTIMIZATION: Use spatial grid to reduce O(n²) to O(n)
    //
    // OLD: 10 players × 100 projectiles = 1000 checks per frame
    // NEW: ~50-100 checks per frame (90% reduction)

    try {
      // Clear and rebuild spatial grid for this frame
      this.spatialGrid.clear();

      // Insert all entities into grid
      const allEntities = [...this.players.values(), ...this.bots.values()];

      allEntities.forEach(entity => this.spatialGrid.insert(entity));
      this.projectiles.forEach(projectile => this.spatialGrid.insert(projectile));
      this.asteroids.forEach(asteroid => this.spatialGrid.insert(asteroid));

      // Player/Bot vs Projectile collisions (using spatial grid)
      this.projectiles.forEach(projectile => {
        // Only check entities near the projectile (3x3 grid area)
        const nearbyEntities = this.spatialGrid.getNearby(projectile);

        nearbyEntities.forEach(entity => {
          // Skip if not a player/bot or is the owner
          if (!entity.health || entity.id === projectile.ownerId || entity.isDead) {
            return;
          }

          const dx = entity.x - projectile.x;
          const dy = entity.y - projectile.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 20) { // Hit detection radius
            // Damage player
            entity.health -= projectile.damage;
            projectile.lifetime = 0; // Mark projectile for removal

            if (entity.health <= 0) {
              entity.isDead = true;
              entity.health = 0;

              // Award kill to shooter
              const shooter = this.players.get(projectile.ownerId) || this.bots.get(projectile.ownerId);
              if (shooter) {
                shooter.kills++;
                shooter.score += 100;
              }

              entity.deaths++;
            }
          }
        });
      });

      // Player/Bot vs Asteroid collisions (using spatial grid)
      allEntities.forEach(entity => {
        if (entity.isDead) return;

        // Only check asteroids near the entity
        const nearbyAsteroids = this.spatialGrid.getNearby(entity);

        nearbyAsteroids.forEach(asteroid => {
          // Skip if not an asteroid
          if (!asteroid.radius) return;

          const dx = entity.x - asteroid.x;
          const dy = entity.y - asteroid.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < asteroid.radius + 20) {
            // Damage from asteroid collision
            entity.health -= 5;
            if (entity.health <= 0) {
              entity.isDead = true;
              entity.health = 0;
              entity.deaths++;
            }
          }
        });
      });

    } catch (err) {
      console.error(`[Game ${this.id}] Collision detection error:`, err.message);
      this.errorCount++;
    }
  }

  cleanupDeadEntities() {
    // Respawn dead players after delay
    const respawnDelay = 3; // seconds

    this.players.forEach(player => {
      if (player.isDead) {
        player.respawnTimer = (player.respawnTimer || 0) + (1 / this.tickRate);
        if (player.respawnTimer >= respawnDelay) {
          this.respawnPlayer(player);
        }
      }
    });

    this.bots.forEach(bot => {
      if (bot.isDead) {
        bot.respawnTimer = (bot.respawnTimer || 0) + (1 / this.tickRate);
        if (bot.respawnTimer >= respawnDelay) {
          this.respawnPlayer(bot);
        }
      }
    });
  }

  respawnPlayer(player) {
    player.x = Math.random() * this.worldSize.width;
    player.y = Math.random() * this.worldSize.height;
    player.velocityX = 0;
    player.velocityY = 0;
    player.rotation = Math.random() * Math.PI * 2;
    player.health = 100;
    player.isDead = false;
    player.respawnTimer = 0;
  }

  addPlayer(socketId, socket, playerData) {
    // Get ship configuration (default to Gunship if not specified)
    const shipType = playerData.shipType || 'gunship';
    const shipConfig = getShipConfig(shipType);

    const player = {
      id: socketId,
      socket: socket,
      name: playerData.name || `Player${socketId.substring(0, 4)}`,
      isBot: false,
      x: Math.random() * this.worldSize.width,
      y: Math.random() * this.worldSize.height,
      velocityX: 0,
      velocityY: 0,
      rotation: Math.random() * Math.PI * 2,
      inputs: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        brake: false
      },
      // Ship-specific stats
      shipType: shipConfig.id,
      shipName: shipConfig.name,
      maxSpeed: shipConfig.maxSpeed,
      acceleration: shipConfig.acceleration,
      rotationSpeed: shipConfig.rotationSpeed,
      friction: shipConfig.friction,
      fireRate: shipConfig.fireRate,
      projectileSpeed: shipConfig.projectileSpeed,
      projectileDamage: shipConfig.projectileDamage,
      projectileLifetime: shipConfig.projectileLifetime,
      size: shipConfig.size,
      color: shipConfig.color,
      shape: shipConfig.shape,
      health: shipConfig.maxHealth,
      maxHealth: shipConfig.maxHealth,
      isDead: false,
      score: 0,
      kills: 0,
      deaths: 0,
      weaponCooldown: 0
    };

    this.players.set(socketId, player);

    // Send initial game state to player
    socket.join(this.id);
    socket.emit('gameJoined', {
      gameId: this.id,
      playerId: socketId,
      worldSize: this.worldSize,
      shipConfig: shipConfig
    });
  }

  addBot() {
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const bot = new Bot(botId, {
      x: Math.random() * this.worldSize.width,
      y: Math.random() * this.worldSize.height,
      rotation: Math.random() * Math.PI * 2
    });

    this.bots.set(botId, bot);
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  hasPlayer(socketId) {
    return this.players.has(socketId);
  }

  getPlayerCount() {
    return this.players.size;
  }

  handlePlayerInput(socketId, input) {
    const player = this.players.get(socketId);
    if (!player || player.isDead) return;

    // Store movement inputs for physics update
    player.inputs = {
      forward: input.forward || false,
      backward: input.backward || false,
      left: input.left || false,
      right: input.right || false,
      brake: input.brake || false
    };

    // Update rotation from mouse angle
    if (input.angle !== undefined) {
      player.rotation = input.angle;
    }

    // Handle shooting
    if (input.fire && player.weaponCooldown <= 0) {
      this.spawnProjectile(player);
      player.weaponCooldown = 0.25;
    }
  }

  spawnProjectile(owner) {
    // CRASH PREVENTION: Limit total projectiles to prevent memory overflow
    if (this.projectiles.length >= this.MAX_PROJECTILES) {
      console.warn(`[Game ${this.id}] Projectile limit reached (${this.MAX_PROJECTILES}), removing oldest`);
      this.projectiles.shift(); // Remove oldest projectile
    }

    const projectileSpeed = 600;
    const projectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      ownerId: owner.id,
      x: owner.x + Math.cos(owner.rotation) * 25,
      y: owner.y + Math.sin(owner.rotation) * 25,
      velocityX: Math.cos(owner.rotation) * projectileSpeed + owner.velocityX,
      velocityY: Math.sin(owner.rotation) * projectileSpeed + owner.velocityY,
      damage: 20,
      lifetime: 2.0 // seconds
    };

    this.projectiles.push(projectile);
  }

  getGameState() {
    return {
      worldSize: this.worldSize,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        rotation: p.rotation,
        health: p.health,
        maxHealth: p.maxHealth,
        isDead: p.isDead,
        score: p.score,
        kills: p.kills,
        deaths: p.deaths
      })),
      bots: Array.from(this.bots.values()).map(b => ({
        id: b.id,
        name: b.name,
        x: b.x,
        y: b.y,
        rotation: b.rotation,
        health: b.health,
        maxHealth: b.maxHealth,
        isDead: b.isDead,
        score: b.score,
        kills: b.kills,
        deaths: b.deaths,
        isBot: true
      })),
      projectiles: this.projectiles.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y
      })),
      asteroids: this.asteroids.map(a => ({
        id: a.id,
        x: a.x,
        y: a.y,
        radius: a.radius,
        rotation: a.rotation
      }))
    };
  }

  broadcastGameState() {
    const state = this.getGameState();
    this.io.to(this.id).emit('gameState', state);
  }

  broadcastChatMessage(senderId, message) {
    const sender = this.players.get(senderId);
    if (sender) {
      this.io.to(this.id).emit('chatMessage', {
        playerId: senderId,
        playerName: sender.name,
        message: message,
        timestamp: Date.now()
      });
    }
  }
}

module.exports = Game;
