/**
 * Ship Type Configuration System - BALANCED COMBAT EDITION
 *
 * Optimized for deliberate, tactical combat with 5-15 second engagements
 * Fire rates reduced for strategic shooting, damage increased for impact
 *
 * Design Philosophy:
 * - Every shot should feel meaningful
 * - Combat should last 5-15 seconds
 * - Players need time to react and strategize
 * - Skill should be rewarded over spam
 */

const SHIP_TYPES = {
  INTERCEPTOR: {
    id: 'interceptor',
    name: 'Interceptor',
    description: 'Fast and agile fighter - precision strikes and mobility',

    // Movement Stats (Asteroids-style speeds maintained)
    maxHealth: 60,
    maxSpeed: 200,           // Fast movement for hit-and-run
    acceleration: 300,
    rotationSpeed: 5.0,      // Quickest turning
    friction: 0.98,

    // Combat Stats - BALANCED FOR DELIBERATE SHOOTING
    fireRate: 750,           // 1.33 shots/second (was 200ms) - Each shot matters
    projectileSpeed: 400,    // 2x ship speed - Fast, precise shots
    projectileDamage: 20,    // 3 hits to kill same class (was 15)
    projectileLifetime: 2.0, // Shorter range encourages closer combat

    // Special Combat Properties
    criticalChance: 0.15,    // 15% chance for 1.5x damage
    projectileSize: 3,       // Smallest projectiles
    muzzleVelocityBonus: 50, // Inherits 50px/s from ship velocity

    // Visual
    size: 25,
    color: '#00FFFF',        // Cyan
    shape: 'triangle',
    projectileColor: '#00FFFF',
    muzzleFlashSize: 20,

    // Gameplay
    difficulty: 'Medium',
    role: 'Skirmisher',
    playstyle: 'Hit-and-run tactics, precision shots',

    // Combat Balance Metrics
    ttk_vs_self: 7.5,        // seconds (3-4 shots at 750ms intervals)
    optimal_range: 250,      // pixels
    engagement_zone: 'close-medium'
  },

  GUNSHIP: {
    id: 'gunship',
    name: 'Gunship',
    description: 'Balanced combat vessel - reliable firepower',

    // Movement Stats
    maxHealth: 100,
    maxSpeed: 150,           // Moderate speed
    acceleration: 200,
    rotationSpeed: 3.0,      // Balanced turning
    friction: 0.95,

    // Combat Stats - BALANCED FOR TACTICAL COMBAT
    fireRate: 1000,          // 1 shot/second (was 300ms) - Rhythmic firing
    projectileSpeed: 350,    // 2.33x ship speed - Balanced velocity
    projectileDamage: 30,    // 3-4 hits to kill same class (was 25)
    projectileLifetime: 2.5, // Medium range

    // Special Combat Properties
    criticalChance: 0.1,     // 10% chance for critical
    projectileSize: 5,       // Medium projectiles
    muzzleVelocityBonus: 30, // Some velocity inheritance

    // Visual
    size: 30,
    color: '#FFD700',        // Gold
    shape: 'rectangle',
    projectileColor: '#FFD700',
    muzzleFlashSize: 25,

    // Gameplay
    difficulty: 'Easy',
    role: 'All-Rounder',
    playstyle: 'Steady damage output, versatile positioning',

    // Combat Balance Metrics
    ttk_vs_self: 10,         // seconds (3-4 shots at 1000ms intervals)
    optimal_range: 300,      // pixels
    engagement_zone: 'medium'
  },

  CRUISER: {
    id: 'cruiser',
    name: 'Cruiser',
    description: 'Heavy battleship - devastating but deliberate',

    // Movement Stats
    maxHealth: 150,
    maxSpeed: 100,           // Slowest movement
    acceleration: 150,
    rotationSpeed: 2.0,      // Slowest turning
    friction: 0.92,

    // Combat Stats - HEAVY CANNON FEEL
    fireRate: 1500,          // 0.67 shots/second (was 500ms) - Each shot is an event
    projectileSpeed: 300,    // 3x ship speed - Compensates for slow ship
    projectileDamage: 50,    // 3 hits to kill same class (was 40)
    projectileLifetime: 3.0, // Longest range for artillery role

    // Special Combat Properties
    criticalChance: 0.05,    // 5% chance but devastating when it hits
    projectileSize: 8,       // Largest projectiles - easier to hit
    muzzleVelocityBonus: 10, // Minimal velocity inheritance
    areaOfEffect: 15,        // Small splash damage radius

    // Visual
    size: 40,
    color: '#FF4444',        // Red
    shape: 'hexagon',
    projectileColor: '#FF6666',
    muzzleFlashSize: 35,

    // Gameplay
    difficulty: 'Hard',
    role: 'Tank/Artillery',
    playstyle: 'Positioning is key, punish mistakes heavily',

    // Combat Balance Metrics
    ttk_vs_self: 12,         // seconds (3 shots at 1500ms intervals)
    optimal_range: 400,      // pixels
    engagement_zone: 'medium-long'
  }
};

// Combat balance configuration
const COMBAT_CONFIG = {
  // Global modifiers for testing
  FIRE_RATE_MODIFIER: 1.0,     // Multiply all fire rates (higher = slower)
  DAMAGE_MODIFIER: 1.0,         // Multiply all damage
  PROJECTILE_SPEED_MODIFIER: 1.0, // Multiply all projectile speeds

  // Hit registration
  HIT_RADIUS: 20,               // Base hit detection radius
  HEADSHOT_RADIUS: 5,           // Precision hit zone for bonus damage

  // Combat feedback
  ENABLE_SCREEN_SHAKE: true,
  ENABLE_HIT_MARKERS: true,
  ENABLE_DAMAGE_NUMBERS: true,
  ENABLE_CRITICAL_HITS: true,

  // Engagement ranges (for AI and HUD indicators)
  CLOSE_RANGE: 200,
  MEDIUM_RANGE: 400,
  LONG_RANGE: 600,

  // Time-to-kill targets
  MIN_TTK: 3,                   // Minimum seconds (glass cannon vs tank)
  TARGET_TTK: 8,                // Target average engagement time
  MAX_TTK: 15,                  // Maximum seconds (tank vs tank)

  // Respawn and recovery
  RESPAWN_TIME: 3,              // Seconds
  SHIELD_REGEN_DELAY: 5,        // Seconds after taking damage
  SHIELD_REGEN_RATE: 10,        // Points per second
};

// Helper function to get ship config with modifiers applied
function getShipConfig(shipType, applyModifiers = true) {
  const type = shipType ? shipType.toUpperCase() : 'GUNSHIP';

  if (!SHIP_TYPES[type]) {
    console.warn(`[ShipTypes] Unknown ship type "${shipType}", defaulting to Gunship`);
    return applyModifiers ? applyModifiers(SHIP_TYPES.GUNSHIP) : SHIP_TYPES.GUNSHIP;
  }

  const config = { ...SHIP_TYPES[type] };

  if (applyModifiers) {
    // Apply global combat modifiers for easy testing
    config.fireRate *= COMBAT_CONFIG.FIRE_RATE_MODIFIER;
    config.projectileDamage *= COMBAT_CONFIG.DAMAGE_MODIFIER;
    config.projectileSpeed *= COMBAT_CONFIG.PROJECTILE_SPEED_MODIFIER;
  }

  return config;
}

// Calculate actual time-to-kill between ship types
function calculateTTK(attackerType, defenderType) {
  const attacker = getShipConfig(attackerType);
  const defender = getShipConfig(defenderType);

  const shotsToKill = Math.ceil(defender.maxHealth / attacker.projectileDamage);
  const timeToKill = (shotsToKill - 1) * (attacker.fireRate / 1000);

  return {
    shotsRequired: shotsToKill,
    timeToKill: timeToKill,
    attackerType: attacker.name,
    defenderType: defender.name
  };
}

// Get combat balance matrix for all ship matchups
function getCombatMatrix() {
  const ships = ['INTERCEPTOR', 'GUNSHIP', 'CRUISER'];
  const matrix = {};

  ships.forEach(attacker => {
    matrix[attacker] = {};
    ships.forEach(defender => {
      matrix[attacker][defender] = calculateTTK(attacker, defender);
    });
  });

  return matrix;
}

function getAllShipTypes() {
  return Object.values(SHIP_TYPES);
}

function isValidShipType(shipType) {
  if (!shipType) return false;
  return SHIP_TYPES.hasOwnProperty(shipType.toUpperCase());
}

function getDefaultShip() {
  return SHIP_TYPES.GUNSHIP;
}

module.exports = {
  SHIP_TYPES,
  COMBAT_CONFIG,
  getShipConfig,
  getAllShipTypes,
  isValidShipType,
  getDefaultShip,
  calculateTTK,
  getCombatMatrix
};