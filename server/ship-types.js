/**
 * Ship Type Configuration System - ASTEROIDS-STYLE SPEEDS
 *
 * Balanced for Asteroids-style gameplay with slower, more controlled movement
 */

const SHIP_TYPES = {
  INTERCEPTOR: {
    id: 'interceptor',
    name: 'Interceptor',
    description: 'Fast and agile fighter - hit and run tactics',

    // Stats (Fast action gameplay)
    maxHealth: 60,
    maxSpeed: 300,           // Reduced from 500 for bots
    acceleration: 400,       // Reduced from 800
    rotationSpeed: 6.0,      // Fast rotation
    friction: 0.99,          // Low friction = drift          

    // Combat (slower bullets = visible)
    fireRate: 500,           // Increased from 200 (was 5 shots/sec, now 2 shots/sec)           
    projectileSpeed: 400,    // Faster bullets
    projectileDamage: 15,    
    projectileLifetime: 2.5, // Increased range to compensate

    // Visual
    size: 25,
    color: '#00FFFF',        
    shape: 'triangle',       

    // Gameplay
    difficulty: 'Medium',
    role: 'Skirmisher'
  },

  GUNSHIP: {
    id: 'gunship',
    name: 'Gunship',
    description: 'Balanced combat vessel - all-around performance',

    // Stats (Fast action gameplay - balanced)
    maxHealth: 100,
    maxSpeed: 250,           // Reduced from 420
    acceleration: 350,       // Reduced from 650
    rotationSpeed: 4.5,      // Good rotation
    friction: 0.985,         // Low friction for drift          

    // Combat
    fireRate: 600,           // Increased from 300 (was 3.3 shots/sec, now 1.67 shots/sec)           
    projectileSpeed: 350,    // Fast bullets
    projectileDamage: 25,    
    projectileLifetime: 3.0, 

    // Visual
    size: 30,
    color: '#FFD700',        
    shape: 'rectangle',      

    // Gameplay
    difficulty: 'Easy',
    role: 'All-Rounder'
  },

  CRUISER: {
    id: 'cruiser',
    name: 'Cruiser',
    description: 'Heavy battleship - devastating firepower',

    // Stats (Fast action gameplay - heavy but powerful)
    maxHealth: 150,
    maxSpeed: 200,           // Reduced from 360
    acceleration: 250,       // Reduced from 500
    rotationSpeed: 3.0,      // Slower rotation
    friction: 0.97,          // More friction for heavy          

    // Combat
    fireRate: 800,           // Increased from 500 (was 2 shots/sec, now 1.25 shots/sec)           
    projectileSpeed: 300,    // Decent bullets
    projectileDamage: 40,    
    projectileLifetime: 4.0, 

    // Visual
    size: 40,
    color: '#FF4444',        
    shape: 'hexagon',        

    // Gameplay
    difficulty: 'Hard',
    role: 'Tank'
  }
};

function getShipConfig(shipType) {
  const type = shipType ? shipType.toUpperCase() : 'GUNSHIP';

  if (!SHIP_TYPES[type]) {
    console.warn(`[ShipTypes] Unknown ship type "${shipType}", defaulting to Gunship`);
    return SHIP_TYPES.GUNSHIP;
  }

  return SHIP_TYPES[type];
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
  getShipConfig,
  getAllShipTypes,
  isValidShipType,
  getDefaultShip
};
