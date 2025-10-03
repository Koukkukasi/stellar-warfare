const fs = require('fs');

// 1. Fix game.js boundaries
const gamePath = './server/game.js';
let gameContent = fs.readFileSync(gamePath, 'utf8');

// Replace wrap-around with boundary collision
const wrapCode = `    // Wrap around world boundaries
    if (entity.x < 0) entity.x += this.worldSize.width;
    if (entity.x > this.worldSize.width) entity.x -= this.worldSize.width;
    if (entity.y < 0) entity.y += this.worldSize.height;
    if (entity.y > this.worldSize.height) entity.y -= this.worldSize.height;`;

const boundaryCode = `    // Boundary collision with bounce
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

gameContent = gameContent.replace(wrapCode, boundaryCode);
fs.writeFileSync(gamePath, gameContent);
console.log('✅ Boundaries');

// 2. Fix minimap export
const minimapPath = './client/minimap.js';
let minimapContent = fs.readFileSync(minimapPath, 'utf8');
minimapContent = minimapContent.replace(
  /\/\/ Export for use in other modules[\s\S]*?if \(typeof module[\s\S]*?\}/,
  '// Export for ES6 modules\nexport { Minimap };'
);
fs.writeFileSync(minimapPath, minimapContent);
console.log('✅ Minimap export');

// 3. Add minimap to main.js
const mainPath = './client/main.js';
let mainContent = fs.readFileSync(mainPath, 'utf8');

if (!mainContent.includes('import { Minimap }')) {
  mainContent = mainContent.replace(
    "import { InputHandler } from './input.js';",
    "import { InputHandler } from './input.js';\nimport { Minimap } from './minimap.js';"
  );
  
  mainContent = mainContent.replace(
    'this.inputHandler = new InputHandler(this.canvas, this.game);',
    `this.inputHandler = new InputHandler(this.canvas, this.game);
        this.minimap = new Minimap(3000, 2000);
        this.minimap.updatePosition(this.canvas);`
  );
  
  mainContent = mainContent.replace(
    'this.renderer.render(this.game.getState());',
    `this.renderer.render(this.game.getState());
        const state = this.game.getState();
        this.renderer.camera.canvas = this.canvas;
        const allEntities = (state.entities || []).concat(state.projectiles || []);
        this.minimap.render(this.ctx, this.renderer.camera, allEntities, state.player);`
  );
  
  mainContent = mainContent.replace(
    'this.renderer.updateCanvasSize(this.canvas);',
    `this.renderer.updateCanvasSize(this.canvas);
        if (this.minimap) this.minimap.updatePosition(this.canvas);`
  );
  
  fs.writeFileSync(mainPath, mainContent);
  console.log('✅ Minimap integrated');
}

console.log('🎉 Done!');
