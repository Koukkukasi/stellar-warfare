const { getShipConfig } = require('./ship-types');

class Bot {
  constructor(id, spawnPosition) {
    this.id = id;
    this.name = this.generateBotName();
    this.isBot = true;

    // Position and movement
    this.x = spawnPosition.x;
    this.y = spawnPosition.y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.rotation = spawnPosition.rotation;

    // Ship configuration (randomize bot ship types)
    const shipTypes = ['interceptor', 'gunship', 'cruiser'];
    const shipType = shipTypes[Math.floor(Math.random() * shipTypes.length)];
    const shipConfig = getShipConfig(shipType);

    // Apply ship configuration
    this.shipType = shipConfig.id;
    this.shipName = shipConfig.name;
    this.maxSpeed = shipConfig.maxSpeed;
    this.acceleration = shipConfig.acceleration;
    this.rotationSpeed = shipConfig.rotationSpeed;
    this.friction = shipConfig.friction;
    this.fireRate = shipConfig.fireRate;
    this.projectileSpeed = shipConfig.projectileSpeed;
    this.projectileDamage = shipConfig.projectileDamage;
    this.projectileLifetime = shipConfig.projectileLifetime;
    this.size = shipConfig.size;
    this.color = shipConfig.color;
    this.shape = shipConfig.shape;

    // Combat stats
    this.health = shipConfig.maxHealth;
    this.maxHealth = shipConfig.maxHealth;
    this.isDead = false;
    this.score = 0;
    this.kills = 0;
    this.deaths = 0;
    this.weaponCooldown = 0;

    // CRITICAL FIX: Add inputs object for physics engine
    this.inputs = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false
    };

    // Movement smoothing
    this.targetRotation = this.rotation;
    this.currentAcceleration = 0;
    this.targetAcceleration = 0;

    // AI state
    this.target = null;
    this.targetType = null; // 'player', 'bot', 'asteroid', null
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderChangeTime = 0;
    this.aggroRange = 600;
    this.shootRange = 400;
    this.avoidanceRange = 150;

    // AI personality (affects behavior)
    this.aggressiveness = 0.3 + Math.random() * 0.7; // 0.3 to 1.0
    this.accuracy = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
    this.reactionTime = 0.2 + Math.random() * 0.3; // 0.2 to 0.5 seconds
    this.reactionTimer = 0;

    // Strafing behavior
    this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
    this.strafeTimer = 0;
  }

  generateBotName() {
    const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma', 'Nova', 'Stellar'];
    const suffixes = ['Hunter', 'Warrior', 'Scout', 'Fighter', 'Defender', 'Raider', 'Ghost', 'Ace'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix} ${suffix}`;
  }

  update(gameState, deltaTime) {
    if (this.isDead) return;

    // Update reaction timer
    this.reactionTimer += deltaTime;

    // Only update AI decisions based on reaction time
    if (this.reactionTimer >= this.reactionTime) {
      this.reactionTimer = 0;

      // Find nearest target
      this.findTarget(gameState);

      // Execute AI behavior
      if (this.target) {
        this.planEngagement(deltaTime);
      } else {
        this.planWander(deltaTime);
      }

      // Avoid asteroids
      this.planAvoidance(gameState.asteroids);
    }

    // Smooth movement transitions
    this.updateMovementInputs(deltaTime);

    // Smooth rotation
    this.updateRotation(deltaTime);

    // Check if bot wants to shoot
    if (this.shouldShoot && this.weaponCooldown <= 0) {
      this.wantsToFireWeapon = true;
    } else {
      this.wantsToFireWeapon = false;
    }
  }

  updateMovementInputs(deltaTime) {
    // Smooth acceleration changes
    const accelerationSmoothing = 3.0; // Higher = smoother
    this.currentAcceleration += (this.targetAcceleration - this.currentAcceleration) * accelerationSmoothing * deltaTime;

    // Reset all inputs
    this.inputs.forward = false;
    this.inputs.backward = false;
    this.inputs.left = false;
    this.inputs.right = false;
    this.inputs.brake = false;

    // Apply movement based on smoothed acceleration
    if (this.currentAcceleration > 10) {
      this.inputs.forward = true;
    } else if (this.currentAcceleration < -10) {
      this.inputs.backward = true;
    } else if (Math.abs(this.currentAcceleration) < 5) {
      this.inputs.brake = true;
    }

    // Apply strafing if in combat
    if (this.target && this.strafeTimer > 0) {
      if (this.strafeDirection > 0) {
        this.inputs.right = true;
      } else {
        this.inputs.left = true;
      }
      this.strafeTimer -= deltaTime;
    }
  }

  updateRotation(deltaTime) {
    // Smooth rotation towards target
    let angleDiff = this.targetRotation - this.rotation;

    // Normalize angle to -PI to PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Apply rotation with smoothing based on ship's rotation speed
    const maxRotationSpeed = (this.rotationSpeed || 3) * deltaTime;
    const rotationAmount = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, angleDiff * 5 * deltaTime));

    this.rotation += rotationAmount;

    // Normalize rotation
    while (this.rotation > Math.PI) this.rotation -= Math.PI * 2;
    while (this.rotation < -Math.PI) this.rotation += Math.PI * 2;
  }

  findTarget(gameState) {
    let nearestDistance = this.aggroRange;
    this.target = null;
    this.targetType = null;

    // Find nearest player (prioritize players over bots)
    gameState.players.forEach(player => {
      if (!player.isDead) {
        const distance = this.getDistance(player.x, player.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          this.target = player;
          this.targetType = 'player';
        }
      }
    });

    // If no players in range, target other bots
    if (!this.target && this.aggressiveness > 0.5) {
      gameState.bots.forEach(bot => {
        if (bot.id !== this.id && !bot.isDead) {
          const distance = this.getDistance(bot.x, bot.y);
          if (distance < nearestDistance * 0.8) { // Slightly prefer players
            nearestDistance = distance;
            this.target = bot;
            this.targetType = 'bot';
          }
        }
      });
    }
  }

  planEngagement(deltaTime) {
    if (!this.target) return;

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToTarget = Math.atan2(dy, dx);

    // Set target rotation
    this.targetRotation = angleToTarget;

    // Calculate angle difference for shooting
    let angleDiff = angleToTarget - this.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Movement strategy based on distance and ship type
    const optimalRange = this.shootRange * 0.6;

    if (distance > this.shootRange) {
      // Too far - move closer
      this.targetAcceleration = this.acceleration;
      this.strafeTimer = 0;
    } else if (distance < optimalRange * 0.5) {
      // Too close - back off
      this.targetAcceleration = -this.acceleration * 0.5;
      this.strafeTimer = 0;
    } else {
      // Good range - engage with strafing
      this.targetAcceleration = this.acceleration * 0.3;

      // Start strafing pattern
      if (this.strafeTimer <= 0) {
        this.strafeTimer = 1.5 + Math.random(); // Strafe for 1.5-2.5 seconds
        this.strafeDirection = Math.random() > 0.5 ? 1 : -1; // Random strafe direction
      }
    }

    // Shooting logic with accuracy consideration
    const aimThreshold = 0.3 / this.accuracy; // Better accuracy = smaller threshold
    if (distance < this.shootRange && Math.abs(angleDiff) < aimThreshold) {
      // Add prediction for moving targets
      const targetVX = this.target.velocityX || 0;
      const targetVY = this.target.velocityY || 0;
      const bulletTravelTime = distance / this.projectileSpeed;

      // Predict where target will be
      const predictedX = this.target.x + targetVX * bulletTravelTime * this.accuracy;
      const predictedY = this.target.y + targetVY * bulletTravelTime * this.accuracy;
      const predictedAngle = Math.atan2(predictedY - this.y, predictedX - this.x);

      this.targetRotation = predictedAngle;
      this.shouldShoot = true;
    } else {
      this.shouldShoot = false;
    }
  }

  planWander(deltaTime) {
    // Change direction periodically
    this.wanderChangeTime += deltaTime;
    if (this.wanderChangeTime > 3 + Math.random() * 2) {
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.wanderChangeTime = 0;
    }

    // Set target rotation to wander angle
    this.targetRotation = this.wanderAngle;

    // Move forward at moderate speed
    this.targetAcceleration = this.acceleration * 0.5;
    this.shouldShoot = false;
    this.strafeTimer = 0;
  }

  planAvoidance(asteroids) {
    // Emergency asteroid avoidance
    let closestAsteroid = null;
    let closestDistance = this.avoidanceRange;

    asteroids.forEach(asteroid => {
      const distance = this.getDistance(asteroid.x, asteroid.y);
      const dangerDistance = this.avoidanceRange + asteroid.radius;

      if (distance < dangerDistance && distance < closestDistance) {
        closestDistance = distance;
        closestAsteroid = asteroid;
      }
    });

    if (closestAsteroid) {
      // Calculate avoidance angle
      const dx = this.x - closestAsteroid.x;
      const dy = this.y - closestAsteroid.y;
      const avoidAngle = Math.atan2(dy, dx);

      // Override target rotation for emergency avoidance
      this.targetRotation = avoidAngle;
      this.targetAcceleration = this.acceleration; // Full speed away
      this.inputs.brake = false; // Don't brake during avoidance
    }
  }

  getDistance(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Method called by game loop to check if bot wants to shoot
  wantsToShoot() {
    return this.wantsToFireWeapon;
  }
}

module.exports = Bot;