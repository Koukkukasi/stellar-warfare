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
    this.collectibles = [];
    this.explosions = []; // Visual explosion effects
    this.floatingTexts = []; // Damage numbers and pickup text

    // Game config - Full HD resolution (not 4K)
    this.worldSize = { width: 3000, height: 2000 };
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
        velocityX: (Math.random() - 0.5) * 100,
        velocityY: (Math.random() - 0.5) * 100,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    // Spawn initial collectibles
    this.spawnCollectibles(10);
  }

  spawnCollectibles(count) {
    // Collectible types - weapon upgrades
    const types = [
      { type: 'triple-shot', color: '#00ff00', radius: 15, effect: 'triple-shot', duration: 10 },
      { type: 'rapid-fire', color: '#00ffff', radius: 15, effect: 'rapid-fire', duration: 8 },
      { type: 'double-damage', color: '#ff0000', radius: 15, effect: 'double-damage', duration: 12 },
      { type: 'piercing', color: '#ffff00', radius: 15, effect: 'piercing', duration: 10 },
      { type: 'homing', color: '#ff00ff', radius: 15, effect: 'homing', duration: 8 }
    ];

    const minDistance = 200; // Minimum distance between collectibles

    for (let i = 0; i < count; i++) {
      const typeData = types[Math.floor(Math.random() * types.length)];

      // Try to find a valid position (max 20 attempts)
      let x, y, validPosition;
      let attempts = 0;

      do {
        x = Math.random() * this.worldSize.width;
        y = Math.random() * this.worldSize.height;
        validPosition = true;

        // Check distance to all existing collectibles
        for (const collectible of this.collectibles) {
          const dx = x - collectible.x;
          const dy = y - collectible.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }

        attempts++;
      } while (!validPosition && attempts < 20);

      // Spawn collectible at found position
      this.collectibles.push({
        id: `collectible_${Date.now()}_${i}`,
        x: x,
        y: y,
        ...typeData,
        spawnTime: Date.now()
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
          if (bot && !bot.isDead && bot.update) {
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
      let botDebugCount = 0;
      this.bots.forEach(bot => {
        try {
          if (bot && !bot.isDead) {
            // DEBUG: Log first bot's inputs every 60 frames (once per second at 60fps)
            if (botDebugCount === 0 && this.lastTickTime % 1000 < 20) {
              console.log(`[DEBUG] Bot ${bot.id.substring(0,8)} inputs: fwd=${bot.inputs?.forward}, left=${bot.inputs?.left}, right=${bot.inputs?.right}, vel=${Math.sqrt(bot.velocityX**2 + bot.velocityY**2).toFixed(1)}`);
            }
            this.updatePlayerPhysics(bot, deltaTime);
            botDebugCount++;
          }
        } catch (err) {
          console.error(`[Game ${this.id}] Bot physics error:`, err.message);
          this.errorCount++;
        }
      });

      // Handle bot weapons
      this.bots.forEach(bot => {
        try {
          if (bot && !bot.isDead && bot.wantsToFireWeapon && bot.weaponCooldown <= 0) {
            this.spawnProjectile(bot, false);
            bot.weaponCooldown = (bot.fireRate || 300) / 1000; // Convert ms to seconds
          }
        } catch (err) {
          console.error(`[Game ${this.id}] Bot weapon error:`, err.message);
          this.errorCount++;
        }
      });

      // Update projectiles
      this.updateProjectiles(deltaTime);

      // Update asteroids
      this.updateAsteroids(deltaTime);

      // Update explosions
      this.updateExplosions(deltaTime);

      // Update floating texts
      this.updateFloatingTexts(deltaTime);

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
    // Calculate acceleration based on WASD inputs (ship-specific)
    let ax = 0;
    let ay = 0;
    const accelForce = entity.acceleration || 500; // Increased for responsive controls
    const drag = 0.98; // Drag coefficient (per-second basis)

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
        // Strong braking
        const brakePower = 0.85;
        entity.velocityX *= Math.pow(brakePower, deltaTime * 60);
        entity.velocityY *= Math.pow(brakePower, deltaTime * 60);
      }
    }

    // Apply acceleration
    entity.velocityX += ax * deltaTime;
    entity.velocityY += ay * deltaTime;

    // Apply drag (frame-rate independent)
    const dragFactor = Math.pow(drag, deltaTime * 60);
    entity.velocityX *= dragFactor;
    entity.velocityY *= dragFactor;

    // Limit max speed (ship-specific)
    const maxSpeed = entity.maxSpeed || 300;
    const speed = Math.sqrt(entity.velocityX ** 2 + entity.velocityY ** 2);
    if (speed > maxSpeed) {
      entity.velocityX = (entity.velocityX / speed) * maxSpeed;
      entity.velocityY = (entity.velocityY / speed) * maxSpeed;
    }

    // Update position
    entity.x += entity.velocityX * deltaTime;
    entity.y += entity.velocityY * deltaTime;

    // Boundary collision - bounce with damping to prevent getting stuck
    const bounce = 0.5; // Bounce damping factor
    const margin = 5; // Keep entities slightly away from exact edge

    if (entity.x < margin) {
      entity.x = margin;
      entity.velocityX = Math.abs(entity.velocityX) * bounce; // Bounce back
    }
    if (entity.x > this.worldSize.width - margin) {
      entity.x = this.worldSize.width - margin;
      entity.velocityX = -Math.abs(entity.velocityX) * bounce; // Bounce back
    }
    if (entity.y < margin) {
      entity.y = margin;
      entity.velocityY = Math.abs(entity.velocityY) * bounce; // Bounce back
    }
    if (entity.y > this.worldSize.height - margin) {
      entity.y = this.worldSize.height - margin;
      entity.velocityY = -Math.abs(entity.velocityY) * bounce; // Bounce back
    }

    // Update weapon cooldowns
    if (entity.weaponCooldown > 0) {
      entity.weaponCooldown -= deltaTime;
    }
    if (entity.secondaryWeaponCooldown > 0) {
      entity.secondaryWeaponCooldown -= deltaTime;
    }
  }

  updateProjectiles(deltaTime) {
    this.projectiles = this.projectiles.filter(projectile => {
      // Homing missile logic
      if (projectile.isHoming) {
        // Find nearest enemy
        const allEntities = [...Array.from(this.players.values()), ...Array.from(this.bots.values())];
        let nearestTarget = null;
        let nearestDistance = Infinity;

        allEntities.forEach(entity => {
          if (entity.id !== projectile.ownerId && !entity.isDead) {
            const dx = entity.x - projectile.x;
            const dy = entity.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < nearestDistance && distance < 500) { // 500px homing range
              nearestDistance = distance;
              nearestTarget = entity;
            }
          }
        });

        // Apply homing acceleration
        if (nearestTarget) {
          const dx = nearestTarget.x - projectile.x;
          const dy = nearestTarget.y - projectile.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const targetAngle = Math.atan2(dy, dx);
            projectile.velocityX += Math.cos(targetAngle) * projectile.homingStrength * deltaTime;
            projectile.velocityY += Math.sin(targetAngle) * projectile.homingStrength * deltaTime;

            // Limit missile speed
            const speed = Math.sqrt(projectile.velocityX ** 2 + projectile.velocityY ** 2);
            const maxSpeed = 600;
            if (speed > maxSpeed) {
              projectile.velocityX = (projectile.velocityX / speed) * maxSpeed;
              projectile.velocityY = (projectile.velocityY / speed) * maxSpeed;
            }
          }
        }
      }

      // Update position
      projectile.x += projectile.velocityX * deltaTime;
      projectile.y += projectile.velocityY * deltaTime;

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
      asteroid.x += asteroid.velocityX * deltaTime;
      asteroid.y += asteroid.velocityY * deltaTime;
      asteroid.rotation += asteroid.rotationSpeed;

      // Wrap around boundaries
      if (asteroid.x < -asteroid.radius) asteroid.x = this.worldSize.width + asteroid.radius;
      if (asteroid.x > this.worldSize.width + asteroid.radius) asteroid.x = -asteroid.radius;
      if (asteroid.y < -asteroid.radius) asteroid.y = this.worldSize.height + asteroid.radius;
      if (asteroid.y > this.worldSize.height + asteroid.radius) asteroid.y = -asteroid.radius;
    });
  }

  updateExplosions(deltaTime) {
    const now = Date.now();
    this.explosions = this.explosions.filter(explosion => {
      const age = (now - explosion.createdAt) / 1000; // Convert to seconds
      return age < explosion.lifetime;
    });
  }

  updateFloatingTexts(deltaTime) {
    const now = Date.now();
    this.floatingTexts = this.floatingTexts.filter(text => {
      const age = (now - text.createdAt) / 1000; // Convert to seconds
      return age < text.lifetime;
    });
  }

  spawnFloatingText(x, y, text, color = '#ffffff', type = 'damage') {
    const floatingText = {
      id: `text_${Date.now()}_${Math.random()}`,
      x: x,
      y: y,
      text: text,
      color: color,
      type: type,
      createdAt: Date.now(),
      lifetime: 1.5 // 1.5 seconds
    };
    this.floatingTexts.push(floatingText);
    console.log('[FloatingText] Created:', text, 'at', x.toFixed(0), y.toFixed(0), 'total:', this.floatingTexts.length);
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

        let projectileHit = false;

        nearbyEntities.forEach(entity => {
          // Skip if not a player/bot or is the owner
          if (!entity.health || entity.id === projectile.ownerId || entity.isDead) {
            return;
          }

          const dx = entity.x - projectile.x;
          const dy = entity.y - projectile.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 20) { // Hit detection radius
            projectileHit = true;

            // For secondary projectiles, deal AoE damage
            if (projectile.isSecondary) {
              // Mark for explosion
              projectile.shouldExplode = true;
              projectile.lifetime = 0;
            } else {
              // Normal projectile - single target damage
              const damage = projectile.damage;
              entity.health -= damage;

              // Piercing projectiles don't get destroyed on hit
              if (!projectile.isPiercing) {
                projectile.lifetime = 0; // Mark projectile for removal
              }

              // Spawn damage text
              this.spawnFloatingText(entity.x, entity.y - 20, `-${Math.round(damage)}`, '#ff4444', 'damage');

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
          }
        });

        // Handle secondary projectile explosion
        if (projectile.shouldExplode) {
          const explosionRadius = 150;

          // Create explosion visual effect
          this.explosions.push({
            id: `explosion_${Date.now()}_${Math.random()}`,
            x: projectile.x,
            y: projectile.y,
            radius: explosionRadius,
            createdAt: Date.now(),
            lifetime: 0.5 // Half second visual
          });

          allEntities.forEach(entity => {
            if (entity.id === projectile.ownerId || entity.isDead) return;

            const dx = entity.x - projectile.x;
            const dy = entity.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < explosionRadius) {
              // Falloff damage based on distance
              const damageFalloff = 1 - (distance / explosionRadius);
              const explosionDamage = projectile.damage * damageFalloff;

              entity.health -= explosionDamage;

              // Spawn explosion damage text
              this.spawnFloatingText(entity.x, entity.y - 20, `-${Math.round(explosionDamage)}`, '#ff8800', 'explosion');

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
        }
      });

      // Player/Bot vs Asteroid collisions (using spatial grid)
      allEntities.forEach(entity => {
        if (entity.isDead) return;

        // Initialize collision cooldown if not exists
        if (!entity.asteroidCollisionCooldown) {
          entity.asteroidCollisionCooldown = 0;
        }

        // Decrease cooldown
        if (entity.asteroidCollisionCooldown > 0) {
          entity.asteroidCollisionCooldown -= 1 / this.tickRate;
        }

        // Only check asteroids near the entity
        const nearbyAsteroids = this.spatialGrid.getNearby(entity);

        nearbyAsteroids.forEach(asteroid => {
          // Skip if not an asteroid
          if (!asteroid.radius) return;

          const dx = entity.x - asteroid.x;
          const dy = entity.y - asteroid.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < asteroid.radius + 20) {
            // Push entity away from asteroid
            const pushForce = 200;
            const angle = Math.atan2(dy, dx);
            entity.velocityX += Math.cos(angle) * pushForce * (1 / this.tickRate);
            entity.velocityY += Math.sin(angle) * pushForce * (1 / this.tickRate);

            // Damage from asteroid collision (with cooldown to prevent constant damage)
            if (entity.asteroidCollisionCooldown <= 0) {
              entity.health -= 5;
              entity.asteroidCollisionCooldown = 0.5; // Half second cooldown

              if (entity.health <= 0) {
                entity.isDead = true;
                entity.health = 0;
                entity.deaths++;
              }
            }
          }
        });
      });

      // Player/Bot vs Collectible collisions
      this.collectibles = this.collectibles.filter(collectible => {
        for (const entity of allEntities) {
          if (entity.isDead) continue;

          const dx = entity.x - collectible.x;
          const dy = entity.y - collectible.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < collectible.radius + 20) {
            // Apply collectible effect
            this.applyCollectibleEffect(entity, collectible);
            return false; // Remove collectible
          }
        }
        return true; // Keep collectible
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

  applyCollectibleEffect(entity, collectible) {
    let pickupText = '';
    let textColor = collectible.color;

    // Initialize weapon upgrades object
    entity.weaponUpgrades = entity.weaponUpgrades || {};

    switch (collectible.effect) {
      case 'triple-shot':
        entity.weaponUpgrades.tripleShot = {
          active: true,
          endTime: Date.now() + (collectible.duration * 1000)
        };
        pickupText = 'TRIPLE SHOT!';
        break;
      case 'rapid-fire':
        entity.weaponUpgrades.rapidFire = {
          active: true,
          endTime: Date.now() + (collectible.duration * 1000)
        };
        pickupText = 'RAPID FIRE!';
        break;
      case 'double-damage':
        entity.weaponUpgrades.doubleDamage = {
          active: true,
          endTime: Date.now() + (collectible.duration * 1000)
        };
        pickupText = 'DOUBLE DAMAGE!';
        break;
      case 'piercing':
        entity.weaponUpgrades.piercing = {
          active: true,
          endTime: Date.now() + (collectible.duration * 1000)
        };
        pickupText = 'PIERCING SHOTS!';
        break;
      case 'homing':
        entity.weaponUpgrades.homing = {
          active: true,
          endTime: Date.now() + (collectible.duration * 1000)
        };
        pickupText = 'HOMING MISSILES!';
        break;
    }

    // Spawn pickup text
    this.spawnFloatingText(collectible.x, collectible.y - 30, pickupText, textColor, 'pickup');

    // Respawn collectible after delay
    setTimeout(() => {
      if (this.isRunning && this.collectibles.length < 15) {
        this.spawnCollectibles(1);
      }
    }, 15000);
  }

  respawnPlayer(player) {
    player.x = Math.random() * this.worldSize.width;
    player.y = Math.random() * this.worldSize.height;
    player.velocityX = 0;
    player.velocityY = 0;
    player.rotation = Math.random() * Math.PI * 2;
    player.health = player.maxHealth || 100; // Use ship-specific health
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
      weaponCooldown: 0,
      secondaryWeaponCooldown: 0
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

    // DEBUG: Log strafe inputs when active
    if (input.left || input.right) {
      console.log(`[DEBUG] Player ${socketId.substring(0,4)} strafe: left=${input.left}, right=${input.right}`);
    }

    // Update rotation from mouse angle
    if (input.angle !== undefined) {
      player.rotation = input.angle;
    }

    // Handle primary shooting (ship-specific fire rate) - only if alive
    if (!player.isDead && input.fire && player.weaponCooldown <= 0) {
      this.spawnProjectile(player, false);

      // Apply rapid fire upgrade
      let fireRate = (player.fireRate || 300) / 1000; // Convert ms to seconds
      const upgrades = player.weaponUpgrades || {};
      if (upgrades.rapidFire?.active && Date.now() < upgrades.rapidFire.endTime) {
        fireRate *= 0.5; // 50% faster firing
      }

      player.weaponCooldown = fireRate;
    }

    // Handle secondary shooting (more powerful, slower cooldown) - only if alive
    if (!player.isDead && input.secondaryFire && player.secondaryWeaponCooldown <= 0) {
      this.spawnProjectile(player, true);
      player.secondaryWeaponCooldown = 3.0; // 3 second cooldown
    }
  }

  spawnProjectile(owner, isSecondary = false) {
    // CRASH PREVENTION: Limit total projectiles to prevent memory overflow
    if (this.projectiles.length >= this.MAX_PROJECTILES) {
      console.warn(`[Game ${this.id}] Projectile limit reached (${this.MAX_PROJECTILES}), removing oldest`);
      this.projectiles.shift(); // Remove oldest projectile
    }

    // Use ship-specific projectile stats
    let projectileSpeed = owner.projectileSpeed || 300;
    let damage = owner.projectileDamage || 20;
    let lifetime = owner.projectileLifetime || 2.0;
    const spawnOffset = owner.size || 25;

    // Apply weapon upgrades
    const upgrades = owner.weaponUpgrades || {};

    // Double damage upgrade
    if (upgrades.doubleDamage?.active && Date.now() < upgrades.doubleDamage.endTime) {
      damage *= 2;
    }

    // Secondary weapon: slower, more powerful, homing
    if (isSecondary) {
      projectileSpeed *= 0.7; // 30% slower
      damage *= 3; // 3x damage
      lifetime *= 1.5; // Lasts longer
    }
    const isHoming = isSecondary; // Secondary weapon is always homing

    // Triple shot upgrade - shoot 3 projectiles in a spread
    if (!isSecondary && upgrades.tripleShot?.active && Date.now() < upgrades.tripleShot.endTime) {
      const spreadAngles = [-0.2, 0, 0.2]; // 3 shots with spread
      spreadAngles.forEach(angleOffset => {
        const angle = owner.rotation + angleOffset;
        this.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          ownerId: owner.id,
          x: owner.x + Math.cos(angle) * spawnOffset,
          y: owner.y + Math.sin(angle) * spawnOffset,
          velocityX: Math.cos(angle) * projectileSpeed + owner.velocityX,
          velocityY: Math.sin(angle) * projectileSpeed + owner.velocityY,
          damage: damage,
          lifetime: lifetime,
          isSecondary: false,
          isPiercing: upgrades.piercing?.active && Date.now() < upgrades.piercing.endTime
        });
      });
      return; // Skip normal projectile spawn
    }

    const projectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      ownerId: owner.id,
      x: owner.x + Math.cos(owner.rotation) * spawnOffset,
      y: owner.y + Math.sin(owner.rotation) * spawnOffset,
      velocityX: Math.cos(owner.rotation) * projectileSpeed + owner.velocityX,
      velocityY: Math.sin(owner.rotation) * projectileSpeed + owner.velocityY,
      damage: damage,
      lifetime: lifetime,
      isSecondary: isSecondary,
      isPiercing: upgrades.piercing?.active && Date.now() < upgrades.piercing.endTime,
      isHoming: isHoming,
      homingStrength: 200 // Acceleration towards target
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
        deaths: p.deaths,
        velocityX: p.velocityX,
        velocityY: p.velocityY,
        shipType: p.shipType,
        color: p.color,
        size: p.size
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
        velocityX: b.velocityX,
        velocityY: b.velocityY,
        shipType: b.shipType,
        color: b.color,
        size: b.size,
        shape: b.shape,
        isBot: true
      })),
      projectiles: this.projectiles.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        isSecondary: p.isSecondary
      })),
      collectibles: this.collectibles.map(c => ({
        id: c.id,
        x: c.x,
        y: c.y,
        type: c.type,
        color: c.color,
        radius: c.radius
      })),
      asteroids: this.asteroids.map(a => ({
        id: a.id,
        x: a.x,
        y: a.y,
        radius: a.radius,
        rotation: a.rotation
      })),
      explosions: this.explosions.map(e => ({
        id: e.id,
        x: e.x,
        y: e.y,
        radius: e.radius,
        age: (Date.now() - e.createdAt) / 1000
      })),
      floatingTexts: this.floatingTexts.map(t => ({
        id: t.id,
        x: t.x,
        y: t.y,
        text: t.text,
        color: t.color,
        type: t.type,
        createdAt: t.createdAt,
        lifetime: t.lifetime
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
