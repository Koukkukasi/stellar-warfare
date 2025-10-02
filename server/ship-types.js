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

    // Stats (Asteroids-style: max ~200 px/s)
    maxHealth: 60,
    maxSpeed: 200,           // Reduced from 400
    acceleration: 300,       // Reduced from 600
    rotationSpeed: 5.0,     
    friction: 0.98,          

    // Combat (slower bullets = visible)
    fireRate: 200,           
    projectileSpeed: 300,    // Reduced from 600
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

    // Stats (Asteroids-style: max ~150 px/s)
    maxHealth: 100,
    maxSpeed: 150,           // Reduced from 300
    acceleration: 200,       // Reduced from 400
    rotationSpeed: 3.0,      
    friction: 0.95,          

    // Combat
    fireRate: 300,           
    projectileSpeed: 250,    // Reduced from 500
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

    // Stats (Asteroids-style: max ~100 px/s)
    maxHealth: 150,
    maxSpeed: 100,           // Reduced from 200
    acceleration: 150,       // Reduced from 250
    rotationSpeed: 2.0,      
    friction: 0.92,          

    // Combat
    fireRate: 500,           
    projectileSpeed: 200,    // Reduced from 400
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
