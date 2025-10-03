const fs = require('fs');

const gamePath = './server/game.js';
let content = fs.readFileSync(gamePath, 'utf8');

// Replace the boundary collision to allow free movement
const oldBoundary = `    // Boundary collision with bounce
    const entitySize = entity.size || 25;
    if (entity.x < entitySize) {
      entity.x = entitySize;
      entity.velocityX *= -0.7;
    }
    if (entity.x > this.worldSize.width - entitySize) {
      entity.x = this.worldSize.width - entitySize;
      entity.velocityX *= -0.7;
    }
    if (entity.y < entitySize) {
      entity.y = entitySize;
      entity.velocityY *= -0.7;
    }
    if (entity.y > this.worldSize.height - entitySize) {
      entity.y = this.worldSize.height - entitySize;
      entity.velocityY *= -0.7;
    }`;

const newBoundary = `    // Boundary collision - soft bounce at edges
    if (entity.x < 0) {
      entity.x = 0;
      entity.velocityX = Math.abs(entity.velocityX) * 0.5;
    }
    if (entity.x > this.worldSize.width) {
      entity.x = this.worldSize.width;
      entity.velocityX = -Math.abs(entity.velocityX) * 0.5;
    }
    if (entity.y < 0) {
      entity.y = 0;
      entity.velocityY = Math.abs(entity.velocityY) * 0.5;
    }
    if (entity.y > this.worldSize.height) {
      entity.y = this.worldSize.height;
      entity.velocityY = -Math.abs(entity.velocityY) * 0.5;
    }`;

content = content.replace(oldBoundary, newBoundary);
fs.writeFileSync(gamePath, content);
console.log('✅ Fixed boundaries for free movement');
