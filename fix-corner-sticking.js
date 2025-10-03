const fs = require('fs');
const path = require('path');

// Fix: Ships get stuck in corners - add pushback from walls
const gameJsPath = path.join(__dirname, 'server', 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

const oldBoundaries = `    // Boundary collision - hard walls (no bounce, just stop at edge)
    if (entity.x < 0) {
      entity.x = 0;
      entity.velocityX = 0;
    }
    if (entity.x > this.worldSize.width) {
      entity.x = this.worldSize.width;
      entity.velocityX = 0;
    }
    if (entity.y < 0) {
      entity.y = 0;
      entity.velocityY = 0;
    }
    if (entity.y > this.worldSize.height) {
      entity.y = this.worldSize.height;
      entity.velocityY = 0;
    }`;

const newBoundaries = `    // Boundary collision - hard walls with slight pushback to prevent corner sticking
    const pushback = 1; // Small pushback distance
    if (entity.x < 0) {
      entity.x = pushback;
      entity.velocityX = 0;
    }
    if (entity.x > this.worldSize.width) {
      entity.x = this.worldSize.width - pushback;
      entity.velocityX = 0;
    }
    if (entity.y < 0) {
      entity.y = pushback;
      entity.velocityY = 0;
    }
    if (entity.y > this.worldSize.height) {
      entity.y = this.worldSize.height - pushback;
      entity.velocityY = 0;
    }`;

gameJs = gameJs.replace(oldBoundaries, newBoundaries);

fs.writeFileSync(gameJsPath, gameJs, 'utf8');

console.log('✅ Fixed corner sticking (added 1px pushback from walls)');
console.log('🔄 Restart the server to apply changes');
