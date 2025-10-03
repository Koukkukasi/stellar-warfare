# Quick Test Checklist - Boundaries & Minimap

## ⚡ Quick Start
1. Start server: `npm start` (from C:/Users/ilmiv/stellar-warfare)
2. Open browser: `http://localhost:3000`
3. Open console: Press F12
4. Join game and spawn

---

## 🎯 BOUNDARIES - 5 Minute Quick Test

### Ship Boundaries (2 min)
- [ ] Hold `A` for 5 sec → Ship stops at left edge (x = 0)
- [ ] Hold `D` for 5 sec → Ship stops at right edge (x = 3000)
- [ ] Hold `W` for 5 sec → Ship stops at top edge (y = 0)
- [ ] Hold `S` for 5 sec → Ship stops at bottom edge (y = 2000)

**Quick Console Check:**
```js
console.log('Position:', game.state.player.x, game.state.player.y);
// Should be: 0 <= x <= 3000, 0 <= y <= 2000
```

### Corner Test (1 min)
- [ ] Navigate to top-left corner → Hold `W+A` → No glitches
- [ ] Navigate to bottom-right → Hold `S+D` → No glitches

### Projectile Test (1 min)
- [ ] Fire projectile at boundary → Projectile stops/bounces (doesn't wrap)

### Visual Test (1 min)
- [ ] Boundary lines visible at all edges
- [ ] No visual glitches when hitting boundaries

---

## 🗺️ MINIMAP - 5 Minute Quick Test

### Display Test (1 min)
- [ ] Minimap visible in top-right corner
- [ ] Size: 200x200 pixels
- [ ] Cyan border visible
- [ ] Semi-transparent black background

### Entity Test (2 min)
- [ ] **Green dot** = Your player (4x4 pixels)
- [ ] **Red dots** = Enemy bots (3x3 pixels)
- [ ] **Gray dots** = Asteroids (2x2 pixels)
- [ ] Green dot has direction indicator line

**Quick Console Check:**
```js
// Your position on minimap
console.log('Player:', game.state.player.x, game.state.player.y);
// Move ship and watch green dot move on minimap
```

### Viewport Test (1 min)
- [ ] Cyan rectangle visible on minimap (shows camera view)
- [ ] Rectangle follows player as you move
- [ ] Rectangle size looks correct

### Real-Time Test (1 min)
- [ ] Move ship → Green dot moves smoothly on minimap
- [ ] No lag between movement and minimap update
- [ ] FPS stays above 55 fps

---

## 🔗 INTEGRATION - 2 Minute Test

### Boundary on Minimap
- [ ] Navigate to x=0 → Green dot at left edge of minimap
- [ ] Navigate to x=3000 → Green dot at right edge of minimap
- [ ] Navigate to center (1500, 1000) → Green dot in center of minimap

**Quick Console Check:**
```js
// Test coordinate mapping
game.state.player.x = 1500; game.state.player.y = 1000;
// Check minimap - green dot should be in center
```

---

## 🐛 Common Issues to Watch For

### Boundaries:
- ❌ Ship position goes negative (x < 0 or y < 0)
- ❌ Ship position exceeds world (x > 3000 or y > 2000)
- ❌ Ship "vibrates" or stutters at boundary
- ❌ Ship wraps around to opposite side (old behavior)
- ❌ Projectiles wrap around

### Minimap:
- ❌ Minimap not visible or wrong position
- ❌ Green dot doesn't appear
- ❌ Green dot doesn't move with player
- ❌ Red dots don't match bot count
- ❌ Viewport rectangle missing
- ❌ FPS drops when near minimap

---

## 📋 Console Commands for Quick Testing

### Position Check:
```js
// Current position
console.log(game.state.player.x, game.state.player.y);

// Teleport to corners for testing
game.state.player.x = 0; game.state.player.y = 0; // Top-left
game.state.player.x = 3000; game.state.player.y = 2000; // Bottom-right
game.state.player.x = 1500; game.state.player.y = 1000; // Center
```

### Boundary Stress Test:
```js
// Try to set invalid position (should clamp)
game.state.player.x = -100; // Should become 0
console.log('X after -100:', game.state.player.x);

game.state.player.x = 3500; // Should become 3000
console.log('X after 3500:', game.state.player.x);
```

### Entity Count:
```js
console.log('Entities:', game.state.entities.length);
console.log('Projectiles:', game.state.projectiles.length);
```

---

## ✅ PASS/FAIL Criteria

### ✅ PASS if:
- All ship boundaries work (no escaping world)
- Minimap displays and updates in real-time
- Green dot = player, Red = enemies, Gray = asteroids
- Viewport rectangle visible and accurate
- FPS stays above 55
- No console errors

### ❌ FAIL if:
- Ship can escape world (x/y out of bounds)
- Minimap not visible or not updating
- Entities missing from minimap
- FPS drops below 50
- Console shows errors
- Wrapping behavior still present

---

## 📊 Full Test Plan

For comprehensive testing, see: **TEST_PLAN_boundaries_minimap.md**
- 30+ detailed test cases
- Console commands reference
- Bug report templates
- ~2.5 hour full test suite
