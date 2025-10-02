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
    this.acceleration = 0;
    this.maxSpeed = 300;

    // Combat stats
    this.health = 100;
    this.maxHealth = 100;
    this.isDead = false;
    this.score = 0;
    this.kills = 0;
    this.deaths = 0;
    this.weaponCooldown = 0;

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

    // Find nearest target
    this.findTarget(gameState);

    // Execute AI behavior
    if (this.target) {
      this.engageTarget(deltaTime);
    } else {
      this.wander(deltaTime);
    }

    // Avoid asteroids
    this.avoidAsteroids(gameState.asteroids);
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
          if (distance < nearestDistance) {
            nearestDistance = distance;
            this.target = bot;
            this.targetType = 'bot';
          }
        }
      });
    }
  }

  engageTarget(deltaTime) {
    if (!this.target) return;

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToTarget = Math.atan2(dy, dx);

    // Rotate towards target
    let angleDiff = angleToTarget - this.rotation;

    // Normalize angle to -PI to PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Rotate towards target
    const rotationSpeed = 0.1;
    if (Math.abs(angleDiff) > 0.1) {
      this.rotation += Math.sign(angleDiff) * rotationSpeed;
    }

    // Movement logic based on distance
    if (distance > this.shootRange * 0.7) {
      // Too far - move closer
      this.acceleration = 500;
    } else if (distance < this.shootRange * 0.5) {
      // Too close - back off slightly
      this.acceleration = -200;
    } else {
      // Good range - strafe
      this.acceleration = 300;
      this.rotation += (Math.random() - 0.5) * 0.05;
    }

    // Shoot if aligned and in range
    if (distance < this.shootRange && Math.abs(angleDiff) < 0.2 / this.accuracy) {
      // Simulate shoot action (this will be handled by game logic)
      this.shouldShoot = this.weaponCooldown <= 0;
    } else {
      this.shouldShoot = false;
    }
  }

  wander(deltaTime) {
    // Change direction periodically
    this.wanderChangeTime += deltaTime;
    if (this.wanderChangeTime > 2) {
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.wanderChangeTime = 0;
    }

    // Gradually rotate towards wander angle
    let angleDiff = this.wanderAngle - this.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const rotationSpeed = 0.05;
    if (Math.abs(angleDiff) > 0.1) {
      this.rotation += Math.sign(angleDiff) * rotationSpeed;
    }

    // Move forward at moderate speed
    this.acceleration = 200;
    this.shouldShoot = false;
  }

  avoidAsteroids(asteroids) {
    // Simple asteroid avoidance
    asteroids.forEach(asteroid => {
      const distance = this.getDistance(asteroid.x, asteroid.y);
      if (distance < this.avoidanceRange + asteroid.radius) {
        // Turn away from asteroid
        const dx = this.x - asteroid.x;
        const dy = this.y - asteroid.y;
        const avoidAngle = Math.atan2(dy, dx);

        let angleDiff = avoidAngle - this.rotation;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Emergency turn
        this.rotation += Math.sign(angleDiff) * 0.15;
      }
    });
  }

  getDistance(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Method called by game loop to check if bot wants to shoot
  wantsToShoot() {
    return this.shouldShoot && this.weaponCooldown <= 0;
  }
}

module.exports = Bot;
