const fs = require('fs');
const path = require('path');

// Fix: Bots don't send visual properties to client (color, size, shape, shipType)
const gameJsPath = path.join(__dirname, 'server', 'game.js');
let gameJs = fs.readFileSync(gameJsPath, 'utf8');

// Find the bot state broadcasting section
const oldBotState = `      bots: Array.from(this.bots.values()).map(b => ({
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
      })),`;

const newBotState = `      bots: Array.from(this.bots.values()).map(b => ({
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
      })),`;

gameJs = gameJs.replace(oldBotState, newBotState);

// Also add debug logging for bot inputs
const oldBotPhysics = `      // Update bot physics
      this.bots.forEach(bot => {
        try {
          if (bot && !bot.isDead) {
            this.updatePlayerPhysics(bot, deltaTime);
          }
        } catch (err) {
          console.error(\`[Game \${this.id}] Bot physics error:\`, err.message);
          this.errorCount++;
        }
      });`;

const newBotPhysics = `      // Update bot physics
      let botDebugCount = 0;
      this.bots.forEach(bot => {
        try {
          if (bot && !bot.isDead) {
            // DEBUG: Log first bot's inputs every 60 frames (once per second at 60fps)
            if (botDebugCount === 0 && this.lastTickTime % 1000 < 20) {
              console.log(\`[DEBUG] Bot \${bot.id.substring(0,8)} inputs: fwd=\${bot.inputs?.forward}, left=\${bot.inputs?.left}, right=\${bot.inputs?.right}, vel=\${Math.sqrt(bot.velocityX**2 + bot.velocityY**2).toFixed(1)}\`);
            }
            this.updatePlayerPhysics(bot, deltaTime);
            botDebugCount++;
          }
        } catch (err) {
          console.error(\`[Game \${this.id}] Bot physics error:\`, err.message);
          this.errorCount++;
        }
      });`;

gameJs = gameJs.replace(oldBotPhysics, newBotPhysics);

// Add debug logging for player strafe inputs
const oldPlayerInput = `    // Store movement inputs for physics update
    player.inputs = {
      forward: input.forward || false,
      backward: input.backward || false,
      left: input.left || false,
      right: input.right || false,
      brake: input.brake || false
    };`;

const newPlayerInput = `    // Store movement inputs for physics update
    player.inputs = {
      forward: input.forward || false,
      backward: input.backward || false,
      left: input.left || false,
      right: input.right || false,
      brake: input.brake || false
    };

    // DEBUG: Log strafe inputs when active
    if (input.left || input.right) {
      console.log(\`[DEBUG] Player \${socketId.substring(0,4)} strafe: left=\${input.left}, right=\${input.right}\`);
    }`;

gameJs = gameJs.replace(oldPlayerInput, newPlayerInput);

// Write the fixed file
fs.writeFileSync(gameJsPath, gameJs, 'utf8');

console.log('✅ Fixed bot display properties (added shipType, color, size, shape, velocityX, velocityY)');
console.log('✅ Added debug logging for bot inputs and player strafe');
console.log('🔄 Restart the server to apply changes');
