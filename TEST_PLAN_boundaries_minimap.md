# Test Plan: Boundaries & Minimap for Stellar Warfare

## Test Environment
- **World Size**: 3000x2000 pixels
- **Minimap Size**: 200x200 pixels (top-right corner)
- **Current Boundary Behavior**: Wrapping (to be changed to solid boundaries)
- **Test Date**: 2025-10-03

---

## 1. BOUNDARY SYSTEM TESTS

### 1.1 Ship Boundary Collision Tests

#### Test 1.1.1: Ship Cannot Exit Left Boundary
**Objective**: Verify ships stop at x=0 boundary

**Steps**:
1. Launch game and spawn player ship
2. Hold `A` key (left movement) continuously for 10 seconds
3. Monitor ship position in UI (top-left corner)
4. Use console command: `game.state.player.x` to check exact position

**Expected Results**:
- Ship position should never show x < 0
- Ship velocity should be clamped to 0 when hitting boundary
- No visual glitches or ship "vibration" at boundary
- Ship should feel "solid" against boundary

**Pass Criteria**: Ship x-coordinate >= 0 at all times

---

#### Test 1.1.2: Ship Cannot Exit Right Boundary
**Objective**: Verify ships stop at x=3000 boundary

**Steps**:
1. Launch game and spawn player ship
2. Hold `D` key (right movement) continuously for 10 seconds
3. Monitor ship position in UI
4. Use console command: `game.state.player.x` to verify x <= 3000

**Expected Results**:
- Ship position should never exceed x = 3000
- Ship should stop smoothly at boundary
- No wrapping or teleportation

**Pass Criteria**: Ship x-coordinate <= 3000 at all times

---

#### Test 1.1.3: Ship Cannot Exit Top Boundary
**Objective**: Verify ships stop at y=0 boundary

**Steps**:
1. Launch game
2. Hold `W` key (upward movement) continuously for 10 seconds
3. Monitor ship position: `game.state.player.y`

**Expected Results**:
- Ship y-coordinate should never be < 0
- Ship velocity clamped when hitting boundary

**Pass Criteria**: Ship y-coordinate >= 0 at all times

---

#### Test 1.1.4: Ship Cannot Exit Bottom Boundary
**Objective**: Verify ships stop at y=2000 boundary

**Steps**:
1. Launch game
2. Hold `S` key (downward movement) continuously for 10 seconds
3. Monitor ship position: `game.state.player.y`

**Expected Results**:
- Ship y-coordinate should never exceed 2000
- Ship stops smoothly at boundary

**Pass Criteria**: Ship y-coordinate <= 2000 at all times

---

#### Test 1.1.5: Corner Collision Test (Top-Left)
**Objective**: Verify ships handle corner collisions without glitches

**Steps**:
1. Navigate ship to top-left corner (x=0, y=0)
2. Hold `W` + `A` keys simultaneously for 5 seconds
3. Try moving in circles at the corner
4. Check console for: `game.state.player.x`, `game.state.player.y`

**Expected Results**:
- Ship should be constrained to x >= 0 AND y >= 0
- No diagonal "sliding" along boundaries
- No visual artifacts or stuttering
- Ship should rotate smoothly even when constrained

**Pass Criteria**: Both x >= 0 AND y >= 0, smooth movement

---

#### Test 1.1.6: Corner Collision Test (Top-Right)
**Objective**: Test top-right corner (x=3000, y=0)

**Steps**:
1. Navigate to top-right corner
2. Hold `W` + `D` keys for 5 seconds
3. Verify position: `game.state.player.x <= 3000 && game.state.player.y >= 0`

**Pass Criteria**: Ship constrained to corner boundaries

---

#### Test 1.1.7: Corner Collision Test (Bottom-Left)
**Objective**: Test bottom-left corner (x=0, y=2000)

**Steps**:
1. Navigate to bottom-left corner
2. Hold `S` + `A` keys for 5 seconds
3. Verify position: `game.state.player.x >= 0 && game.state.player.y <= 2000`

**Pass Criteria**: Ship constrained to corner boundaries

---

#### Test 1.1.8: Corner Collision Test (Bottom-Right)
**Objective**: Test bottom-right corner (x=3000, y=2000)

**Steps**:
1. Navigate to bottom-right corner
2. Hold `S` + `D` keys for 5 seconds
3. Verify position: `game.state.player.x <= 3000 && game.state.player.y <= 2000`

**Pass Criteria**: Ship constrained to corner boundaries

---

#### Test 1.1.9: High-Speed Boundary Collision
**Objective**: Verify boundaries work at maximum ship speed

**Steps**:
1. Select fastest ship type (press `1` for Interceptor)
2. Accelerate to maximum speed (`W` key)
3. Approach each boundary at maximum velocity
4. Verify ship stops without overshooting

**Expected Results**:
- Ship should not "tunnel" through boundaries
- No position overshooting (e.g., x = -50 or x = 3050)
- Smooth deceleration at boundary

**Pass Criteria**: Ship stops at boundary regardless of velocity

---

### 1.2 Projectile Boundary Tests

#### Test 1.2.1: Projectiles Stop at Boundaries
**Objective**: Verify projectiles don't escape world boundaries

**Steps**:
1. Position ship near left boundary (x < 100)
2. Aim left and fire projectile (Left Click)
3. Watch projectile travel to boundary
4. Monitor projectile array: `game.state.projectiles`

**Expected Results**:
- Projectile should disappear when reaching x = 0
- Projectile should NOT wrap around to opposite side
- No projectiles should exist with x < 0 or x > 3000

**Pass Criteria**: All projectiles have 0 <= x <= 3000 and 0 <= y <= 2000

---

#### Test 1.2.2: Projectile Behavior Options
**Objective**: Verify projectile boundary behavior (stop or bounce)

**Note**: Decide on implementation:
- **Option A**: Projectiles disappear at boundary
- **Option B**: Projectiles bounce off boundaries

**Test for Option A (Disappear)**:
1. Fire projectile at each boundary
2. Verify projectile is removed from `game.state.projectiles`

**Test for Option B (Bounce)**:
1. Fire projectile at boundary
2. Verify velocity reverses: `velocityX` becomes `-velocityX`
3. Projectile should bounce back into play area

**Pass Criteria**: Consistent behavior at all 4 boundaries

---

### 1.3 Visual Boundary Indicators

#### Test 1.3.1: Boundary Lines Visible
**Objective**: Verify boundary visualization

**Steps**:
1. Start game
2. Navigate to each edge of the world
3. Look for visual boundary indicators (lines, walls, etc.)

**Expected Results**:
- Clear visual indication of world edges
- Boundaries visible from distance
- Consistent styling (color, thickness)

**Visual Inspection**: Take screenshot of each boundary

---

#### Test 1.3.2: Boundary Rendering Performance
**Objective**: Ensure boundaries don't impact FPS

**Steps**:
1. Monitor FPS counter (top-left UI)
2. Navigate along all boundaries
3. Compare FPS at center vs. edges

**Expected Results**:
- FPS should remain consistent (55-60 fps)
- No frame drops near boundaries

**Pass Criteria**: FPS variation < 5 fps

---

### 1.4 Bot and Asteroid Boundary Tests

#### Test 1.4.1: Bots Respect Boundaries
**Objective**: Verify AI bots don't escape world

**Steps**:
1. Start game (bots spawn automatically)
2. Observe bot movement for 2 minutes
3. Check bot positions: `Array.from(game.state.entities).map(e => ({x: e.x, y: e.y}))`

**Expected Results**:
- All bots constrained to world boundaries
- Bots should navigate away from boundaries
- No bots with out-of-bounds coordinates

**Pass Criteria**: All bots within 0-3000 x and 0-2000 y

---

#### Test 1.4.2: Asteroids Respect Boundaries
**Objective**: Verify asteroids don't wrap around

**Steps**:
1. Observe asteroid movement
2. Check asteroid positions in console
3. Monitor for 1 minute

**Expected Results**:
- Asteroids bounce off boundaries OR stop at edges
- No asteroids outside world bounds

**Pass Criteria**: All asteroids within world boundaries

---

## 2. MINIMAP SYSTEM TESTS

### 2.1 Minimap Display Tests

#### Test 2.1.1: Minimap Renders Correctly
**Objective**: Verify minimap appears in top-right corner

**Steps**:
1. Start game
2. Look for minimap in top-right corner
3. Verify size: 200x200 pixels
4. Check visual properties:
   - Background: semi-transparent black
   - Border: cyan (#00ffff)
   - Positioned with 20px padding from edges

**Expected Results**:
- Minimap visible at all times
- Correct size and position
- Clear border and background

**Visual Inspection**: Take screenshot

**Pass Criteria**: Minimap visible and properly positioned

---

#### Test 2.1.2: World Scale Accuracy
**Objective**: Verify 3000x2000 world fits in 200x200 minimap

**Steps**:
1. Navigate to corner (0, 0)
2. Check player position on minimap (should be top-left of minimap)
3. Navigate to (3000, 2000)
4. Check player position (should be bottom-right of minimap)
5. Navigate to center (1500, 1000)
6. Player should be at minimap center

**Expected Results**:
- World coordinates map correctly to minimap
- Scale factors: scaleX = 200/3000, scaleY = 200/2000
- No distortion or incorrect positioning

**Console Commands**:
```javascript
// Check player position on minimap
const minimap = renderer.minimap; // Assuming minimap is accessible
const pos = minimap.worldToMinimap(game.state.player.x, game.state.player.y);
console.log('Player minimap pos:', pos);
```

**Pass Criteria**: Accurate position mapping at corners and center

---

### 2.2 Entity Representation Tests

#### Test 2.2.1: Player Appears as Green Dot
**Objective**: Verify player ship renders correctly on minimap

**Steps**:
1. Start game
2. Locate green dot on minimap
3. Move ship around world
4. Verify green dot follows player movement in real-time

**Expected Results**:
- Player represented as 4x4 pixel green dot (#00ff00)
- Player direction indicator (8-pixel line) shows ship angle
- Smooth movement on minimap

**Pass Criteria**: Green dot visible and tracks player position

---

#### Test 2.2.2: Enemy Ships Appear as Red Dots
**Objective**: Verify enemy ships/bots render on minimap

**Steps**:
1. Observe bots on minimap (red dots)
2. Count visible red dots
3. Compare to actual bot count in game
4. Verify red dot positions match bot world positions

**Expected Results**:
- Enemy ships: 3x3 pixel red dots (#ff0000)
- All enemies visible on minimap
- Positions update in real-time

**Console Commands**:
```javascript
// Count bots in game
console.log('Bot count:', game.state.entities.filter(e => e.type === 'bot').length);
```

**Pass Criteria**: All enemies visible as red dots

---

#### Test 2.2.3: Asteroids Appear as Gray Dots
**Objective**: Verify asteroids render on minimap

**Steps**:
1. Locate gray dots on minimap
2. Navigate to asteroid in game world
3. Verify minimap dot corresponds to asteroid position

**Expected Results**:
- Asteroids: 2x2 pixel gray dots (#888888)
- All asteroids visible on minimap
- Static or slow-moving dots

**Pass Criteria**: Asteroids visible and correctly positioned

---

#### Test 2.2.4: Projectiles Visible (Optional)
**Objective**: Check if projectiles appear on minimap

**Steps**:
1. Fire multiple projectiles
2. Look for white dots on minimap (1x1 pixels, #ffffff)
3. Verify they appear briefly then disappear

**Expected Results**:
- Small white dots for active projectiles
- Dots disappear when projectiles expire

**Note**: May be too small to see clearly

**Pass Criteria**: Projectiles optionally visible

---

### 2.3 Viewport Rectangle Tests

#### Test 2.3.1: Viewport Rectangle Displays
**Objective**: Verify camera viewport shows on minimap

**Steps**:
1. Observe cyan rectangle on minimap
2. This rectangle represents visible game area
3. Move camera by moving player ship
4. Verify rectangle follows camera

**Expected Results**:
- Semi-transparent cyan rectangle (rgba(0, 255, 255, 0.3))
- Cyan border (1px, #00ffff)
- Rectangle size represents camera zoom and canvas size
- Rectangle moves as camera follows player

**Pass Criteria**: Viewport rectangle visible and tracks camera

---

#### Test 2.3.2: Viewport Zoom Accuracy
**Objective**: Verify viewport rectangle resizes with zoom

**Steps**:
1. Note initial viewport rectangle size on minimap
2. Zoom in (if zoom controls exist)
3. Verify rectangle shrinks (smaller visible area)
4. Zoom out
5. Verify rectangle expands

**Expected Results**:
- Viewport rectangle size inversely proportional to zoom
- Higher zoom = smaller rectangle on minimap
- Lower zoom = larger rectangle

**Console Commands**:
```javascript
// Manually set zoom
camera.setZoom(0.8); // Zoom out
camera.setZoom(1.2); // Zoom in
```

**Pass Criteria**: Rectangle size reflects zoom level

---

### 2.4 Minimap Interactivity Tests

#### Test 2.4.1: Minimap Hover Detection
**Objective**: Verify hover effect on minimap

**Steps**:
1. Move mouse cursor over minimap
2. Look for visual hover indicator (white outline)
3. Move cursor away
4. Verify hover effect disappears

**Expected Results**:
- Hover effect: white outline (rgba(255, 255, 255, 0.5))
- Smooth hover transition
- Cursor changes (optional)

**Pass Criteria**: Hover effect visible when cursor over minimap

---

#### Test 2.4.2: Minimap Click Navigation (If Implemented)
**Objective**: Test click-to-navigate functionality

**Steps**:
1. Click on minimap at specific location
2. Verify camera/player moves to clicked world location
3. Try clicking multiple locations

**Expected Results**:
- Clicking minimap moves camera or player
- Accurate position conversion from minimap to world coords

**Console Test**:
```javascript
// Simulate click on minimap
const minimapX = minimap.x + 100; // Middle of minimap
const minimapY = minimap.y + 100;
const worldPos = minimap.minimapToWorld(minimapX, minimapY);
console.log('Clicked world pos:', worldPos); // Should be ~(1500, 1000)
```

**Pass Criteria**: Click navigation works accurately

---

### 2.5 Minimap Real-Time Update Tests

#### Test 2.5.1: Real-Time Entity Tracking
**Objective**: Verify minimap updates every frame

**Steps**:
1. Observe player green dot on minimap
2. Move ship continuously
3. Count minimap update lag (if any)

**Expected Results**:
- Minimap updates at 60 fps (or game's target FPS)
- No visible lag between ship movement and minimap dot
- Smooth minimap animations

**Pass Criteria**: No perceptible lag (< 50ms)

---

#### Test 2.5.2: Large Entity Count Performance
**Objective**: Test minimap with many entities

**Steps**:
1. Spawn multiple bots (if possible via console)
2. Fire many projectiles
3. Monitor FPS counter
4. Check if minimap rendering impacts performance

**Console Command** (if available):
```javascript
// Spawn additional bots (server-side, if accessible)
// For client testing, just observe with existing entities
```

**Expected Results**:
- Minimap renders efficiently with 10+ entities
- No frame drops
- FPS remains stable (>55 fps)

**Pass Criteria**: FPS drop < 5 fps with high entity count

---

### 2.6 Minimap Edge Cases

#### Test 2.6.1: Minimap at Window Resize
**Objective**: Verify minimap repositions on window resize

**Steps**:
1. Note minimap position (top-right corner)
2. Resize browser window (make smaller)
3. Verify minimap repositions correctly (still in top-right)
4. Resize window (make larger)
5. Verify minimap position updates

**Expected Results**:
- Minimap always positioned: x = canvas.width - 200 - 20
- Minimap stays in top-right corner
- 20px padding maintained

**Pass Criteria**: Minimap repositions on resize

---

#### Test 2.6.2: Minimap with No Entities
**Objective**: Test minimap when world is empty

**Steps**:
1. Kill/remove all bots and asteroids (console command)
2. Only player should remain
3. Verify minimap still renders
4. Only green dot visible

**Expected Results**:
- Minimap renders normally
- Background, border, viewport rectangle visible
- Only player dot present

**Pass Criteria**: Minimap functional with minimal entities

---

## 3. INTEGRATION TESTS

### 3.1 Boundary + Minimap Integration

#### Test 3.1.1: Player at Boundary Shows Correct Minimap Position
**Objective**: Verify boundary collisions reflect accurately on minimap

**Steps**:
1. Navigate player to left boundary (x=0)
2. Check minimap - green dot should be at left edge
3. Repeat for all 4 boundaries

**Expected Results**:
- Player at x=0: green dot at left edge of minimap
- Player at x=3000: green dot at right edge
- Player at y=0: green dot at top edge
- Player at y=2000: green dot at bottom edge

**Pass Criteria**: Boundary positions accurate on minimap

---

#### Test 3.1.2: Viewport Rectangle at Boundaries
**Objective**: Verify viewport rectangle clamping at boundaries

**Steps**:
1. Navigate to top-left corner (0, 0)
2. Viewport rectangle should be in top-left of minimap
3. Part of viewport may extend beyond minimap edge (valid)
4. Navigate to center, verify rectangle moves freely

**Expected Results**:
- Viewport rectangle clamped when camera at boundaries
- Rectangle shows correct visible area

**Pass Criteria**: Viewport rectangle accurately reflects camera

---

### 3.2 Multi-Player Boundary Tests (If Multiplayer Enabled)

#### Test 3.2.1: Multiple Players at Boundaries
**Objective**: Test boundary collisions with multiple players

**Steps**:
1. Connect 2+ players
2. Have all players navigate to same boundary
3. Verify no collision between players at boundary
4. All players should be constrained to boundary

**Pass Criteria**: All players respect boundaries independently

---

#### Test 3.2.2: Minimap Shows All Players
**Objective**: Verify all connected players visible on minimap

**Steps**:
1. Connect multiple players
2. Check minimap for multiple dots
3. Distinguish player (green) from enemies (red)

**Expected Results**:
- Own player: green dot
- Other players: red dots (or different color)

**Pass Criteria**: All players visible on minimap

---

## 4. CONSOLE COMMANDS FOR TESTING

### 4.1 Position and State Commands

```javascript
// Get player position
console.log('Player pos:', game.state.player.x, game.state.player.y);

// Get player velocity
console.log('Player velocity:', game.state.player.vx, game.state.player.vy);

// Get all entity positions
game.state.entities.forEach(e => {
  console.log(`Entity ${e.id}: (${e.x}, ${e.y})`);
});

// Get projectile positions
game.state.projectiles.forEach(p => {
  console.log(`Projectile: (${p.x}, ${p.y})`);
});

// Check if player at boundary
const atLeftBoundary = game.state.player.x === 0;
const atRightBoundary = game.state.player.x === 3000;
const atTopBoundary = game.state.player.y === 0;
const atBottomBoundary = game.state.player.y === 2000;
console.log('At boundary:', {atLeftBoundary, atRightBoundary, atTopBoundary, atBottomBoundary});
```

### 4.2 Camera and Minimap Commands

```javascript
// Get camera position
console.log('Camera:', camera.x, camera.y, 'Zoom:', camera.zoom);

// Get minimap info (if accessible)
console.log('Minimap:', minimap.x, minimap.y, minimap.width, minimap.height);

// Test coordinate conversion
const worldPos = {x: 1500, y: 1000}; // Center of world
const minimapPos = minimap.worldToMinimap(worldPos.x, worldPos.y);
console.log('World center on minimap:', minimapPos);

// Reverse conversion
const worldPosBack = minimap.minimapToWorld(minimapPos.x, minimapPos.y);
console.log('Converted back to world:', worldPosBack);
```

### 4.3 Teleport Commands (For Testing)

```javascript
// Teleport to corner (top-left)
game.state.player.x = 0;
game.state.player.y = 0;

// Teleport to corner (bottom-right)
game.state.player.x = 3000;
game.state.player.y = 2000;

// Teleport to center
game.state.player.x = 1500;
game.state.player.y = 1000;

// Teleport near boundary
game.state.player.x = 10; // Close to left edge
game.state.player.y = 1000;
```

### 4.4 Boundary Stress Tests

```javascript
// Attempt to set position outside boundaries (should fail/clamp)
game.state.player.x = -100; // Should be clamped to 0
game.state.player.x = 3500; // Should be clamped to 3000
console.log('Player x after invalid set:', game.state.player.x);

// Set extreme velocity toward boundary
game.state.player.vx = -1000; // Extreme leftward velocity
game.state.player.x = 50; // Near left boundary
// Wait a few frames and check if player stopped at x=0
```

### 4.5 FPS and Performance Commands

```javascript
// Monitor FPS
setInterval(() => {
  console.log('Current FPS:', document.getElementById('fps').textContent);
}, 1000);

// Count entities
const entityCount = game.state.entities.length;
const projectileCount = game.state.projectiles.length;
console.log('Entities:', entityCount, 'Projectiles:', projectileCount);
```

---

## 5. ACCEPTANCE CRITERIA SUMMARY

### Boundaries System - PASS Criteria:
- ✅ Ships cannot exit world bounds (0 to 3000 x, 0 to 2000 y)
- ✅ Ships stop smoothly at boundaries without glitches
- ✅ Projectiles stop or bounce at boundaries (no wrapping)
- ✅ Visual boundary indicators clear and visible
- ✅ Corner collisions work without stuttering
- ✅ High-speed collisions handled correctly
- ✅ No performance impact from boundary checks

### Minimap System - PASS Criteria:
- ✅ Minimap renders in top-right corner (200x200px)
- ✅ Full 3000x2000 world visible on minimap
- ✅ Player appears as green dot with direction indicator
- ✅ Enemy ships appear as red dots
- ✅ Asteroids appear as gray dots
- ✅ Viewport rectangle shows camera view area
- ✅ Real-time updates (60 fps) with no lag
- ✅ Accurate coordinate mapping (world ↔ minimap)
- ✅ Minimap repositions correctly on window resize
- ✅ No performance impact (FPS drop < 5)

### Integration - PASS Criteria:
- ✅ Boundary positions reflect accurately on minimap
- ✅ Viewport rectangle clamped correctly at boundaries
- ✅ All systems work together without conflicts

---

## 6. BUG REPORT TEMPLATE

If issues are found during testing, use this template:

```
**Bug ID**: BND-001 or MAP-001
**Severity**: Critical / High / Medium / Low
**Test Case**: [e.g., Test 1.1.1]

**Description**:
[Clear description of the issue]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Console Output**:
[Any error messages or console logs]

**Screenshot/Video**:
[Attach if applicable]

**Environment**:
- Browser: [Chrome/Firefox/etc.]
- OS: [Windows/Mac/Linux]
- Screen Resolution: [e.g., 1920x1080]
```

---

## 7. TEST EXECUTION CHECKLIST

### Pre-Test Setup:
- [ ] Server running on `localhost:3000`
- [ ] Client loaded in browser
- [ ] Console open (F12) for command access
- [ ] FPS counter visible
- [ ] Position UI visible (top-left)
- [ ] Minimap visible (top-right)

### Test Execution:
- [ ] Complete Section 1: Boundary Tests (1.1 - 1.4)
- [ ] Complete Section 2: Minimap Tests (2.1 - 2.6)
- [ ] Complete Section 3: Integration Tests
- [ ] Run Console Commands (Section 4)
- [ ] Document all bugs found

### Post-Test:
- [ ] All critical bugs resolved
- [ ] Re-test failed test cases
- [ ] Final acceptance criteria check
- [ ] Sign-off on boundaries feature
- [ ] Sign-off on minimap feature

---

## 8. TESTING NOTES

### Known Limitations:
- World size may differ between server (1920x1080) and client expectations (3000x2000) - verify server updated to 3000x2000
- Projectile boundary behavior (stop vs bounce) may need design decision
- Minimap click-to-navigate may not be implemented yet

### Performance Benchmarks:
- Target FPS: 60 fps
- Acceptable FPS: 55-60 fps
- Entity count: 10-20 entities typical
- Projectile count: 10-50 projectiles

### Test Duration Estimate:
- Boundary Tests: 45 minutes
- Minimap Tests: 45 minutes
- Integration Tests: 30 minutes
- Console Testing: 20 minutes
- **Total: ~2.5 hours**

---

## 9. SIGN-OFF

**Tester Name**: _______________________
**Test Date**: _______________________
**Test Result**: PASS / FAIL / PARTIAL

**Boundaries Feature**: ✅ PASS  ❌ FAIL
**Minimap Feature**: ✅ PASS  ❌ FAIL

**Notes**:
_________________________________________________
_________________________________________________
_________________________________________________

**Signature**: _______________________
