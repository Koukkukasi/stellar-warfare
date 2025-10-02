/**
 * Ship Type Configuration System
 *
 * Defines three distinct ship classes with different stats and playstyles:
 * - Interceptor: Fast, fragile, high maneuverability
 * - Gunship: Balanced, versatile, medium stats
 * - Cruiser: Slow, tanky, heavy firepower
 */

const SHIP_TYPES = {
  INTERCEPTOR: {
    id: 'interceptor',
    name: 'Interceptor',
    description: 'Fast and agile fighter - hit and run tactics',

    // Stats
    maxHealth: 60,
    maxSpeed: 400,           // Fast movement
    acceleration: 600,       // Quick acceleration
    rotationSpeed: 5.0,      // High maneuverability
    friction: 0.98,          // Low friction (slides more)

    // Combat
    fireRate: 200,           // Fast firing (200ms between shots)
    projectileSpeed: 600,    // Fast projectiles
    projectileDamage: 15,    // Low damage per shot
    projectileLifetime: 1.5, // Short range

    // Visual
    size: 25,
    color: '#00FFFF',        // Cyan
    shape: 'triangle',       // Sleek design

    // Gameplay
    difficulty: 'Medium',
    role: 'Skirmisher'
  },

  GUNSHIP: {
    id: 'gunship',
    name: 'Gunship',
    description: 'Balanced combat vessel - all-around performance',

    // Stats
    maxHealth: 100,
    maxSpeed: 300,           // Medium movement
    acceleration: 400,       // Medium acceleration
    rotationSpeed: 3.0,      // Medium maneuverability
    friction: 0.95,          // Medium friction

    // Combat
    fireRate: 300,           // Medium firing (300ms between shots)
    projectileSpeed: 500,    // Medium projectiles
    projectileDamage: 25,    // Medium damage
    projectileLifetime: 2.0, // Medium range

    // Visual
    size: 30,
    color: '#FFD700',        // Gold
    shape: 'rectangle',      // Classic design

    // Gameplay
    difficulty: 'Easy',
    role: 'All-Rounder'
  },

  CRUISER: {
    id: 'cruiser',
    name: 'Cruiser',
    description: 'Heavy battleship - devastating firepower',

    // Stats
    maxHealth: 150,
    maxSpeed: 200,           // Slow movement
    acceleration: 250,       // Slow acceleration
    rotationSpeed: 2.0,      // Low maneuverability
    friction: 0.92,          // High friction (stops faster)

    // Combat
    fireRate: 500,           // Slow firing (500ms between shots)
    projectileSpeed: 400,    // Slow projectiles
    projectileDamage: 40,    // High damage per shot
    projectileLifetime: 3.0, // Long range

    // Visual
    size: 40,
    color: '#FF4444',        // Red
    shape: 'hexagon',        // Heavy design

    // Gameplay
    difficulty: 'Hard',
    role: 'Tank'
  }
};

/**
 * Get ship configuration by type
 * @param {string} shipType - 'interceptor', 'gunship', or 'cruiser'
 * @returns {object} Ship configuration
 */
function getShipConfig(shipType) {
  const type = shipType ? shipType.toUpperCase() : 'GUNSHIP';

  if (!SHIP_TYPES[type]) {
    console.warn(`[ShipTypes] Unknown ship type "${shipType}", defaulting to Gunship`);
    return SHIP_TYPES.GUNSHIP;
  }

  return SHIP_TYPES[type];
}

/**
 * Get all available ship types
 * @returns {array} Array of ship configurations
 */
function getAllShipTypes() {
  return Object.values(SHIP_TYPES);
}

/**
 * Validate ship type
 * @param {string} shipType - Ship type to validate
 * @returns {boolean} True if valid
 */
function isValidShipType(shipType) {
  if (!shipType) return false;
  return SHIP_TYPES.hasOwnProperty(shipType.toUpperCase());
}

/**
 * Get default ship type
 * @returns {object} Default ship configuration (Gunship)
 */
function getDefaultShip() {
  return SHIP_TYPES.GUNSHIP;
}

module.exports = {
  SHIP_TYPES,
  getShipConfig,
  getAllShipTypes,
  isValidShipType,
  getDefaultShip
};
