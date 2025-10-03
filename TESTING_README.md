# Stellar Warfare - Testing Documentation

## Overview

This directory contains comprehensive test documentation for the **Boundaries** and **Minimap** features in Stellar Warfare.

**World Specifications:**
- World Size: **3000x2000 pixels**
- Minimap Size: **200x200 pixels** (top-right corner)
- Expected Behavior: **Solid boundaries** (no wrapping)

---

## Test Documentation Files

### 1. **TEST_PLAN_boundaries_minimap.md** (Comprehensive)
📄 **Size**: 24 KB | ⏱️ **Time**: ~2.5 hours

**What it contains:**
- 30+ detailed test cases
- Boundary collision tests (ships, projectiles, corners)
- Minimap display and functionality tests
- Entity representation tests (player, enemies, asteroids)
- Integration tests
- Console commands for testing
- Bug report templates
- Acceptance criteria checklist

**Use when:**
- Performing thorough QA testing
- Need detailed test procedures
- Writing bug reports
- Final feature acceptance

---

### 2. **QUICK_TEST_CHECKLIST.md** (Quick Reference)
📄 **Size**: 4.6 KB | ⏱️ **Time**: ~10 minutes

**What it contains:**
- 5-minute boundary quick test
- 5-minute minimap quick test
- 2-minute integration test
- Essential console commands
- Pass/fail criteria
- Common issues to watch for

**Use when:**
- Need fast verification
- Pre-commit testing
- Daily sanity checks
- Quick smoke tests

---

### 3. **VISUAL_TEST_GUIDE.md** (Visual Reference)
📄 **Size**: 17 KB | ⏱️ **Time**: ~3-5 minutes

**What it contains:**
- ASCII diagrams of world layout
- Minimap visual representation
- Boundary collision scenarios
- Entity color reference
- Screenshot locations guide
- Visual bug examples (good vs bad)
- Debug overlay suggestions

**Use when:**
- Need visual reference
- Taking screenshots for documentation
- Explaining features to team
- Visual QA verification

---

## Quick Start Guide

### For Developers (Quick Test)
```bash
# 1. Start server
cd C:/Users/ilmiv/stellar-warfare
npm start

# 2. Open browser
# Navigate to: http://localhost:3000

# 3. Open browser console (F12)

# 4. Run quick tests
# Follow: QUICK_TEST_CHECKLIST.md
```

**Time**: 10-15 minutes

---

### For QA Team (Full Test)
```bash
# 1. Start server
npm start

# 2. Open browser to http://localhost:3000

# 3. Follow comprehensive test plan
# See: TEST_PLAN_boundaries_minimap.md

# 4. Use visual guide for reference
# See: VISUAL_TEST_GUIDE.md

# 5. Document results using bug templates
```

**Time**: 2-3 hours

---

## Test Priorities

### Priority 1: Critical (Must Pass)
- [ ] Ships cannot escape world boundaries
- [ ] No wrapping behavior (ships stay in 0-3000 x, 0-2000 y)
- [ ] Minimap displays and updates in real-time
- [ ] Player appears as green dot on minimap
- [ ] No console errors

**Tests**: Quick Test Checklist sections 1-3

---

### Priority 2: High (Should Pass)
- [ ] Corner collisions work smoothly
- [ ] Projectiles stop at boundaries
- [ ] Enemy/asteroid dots visible on minimap
- [ ] Viewport rectangle tracks camera
- [ ] Boundary lines visible

**Tests**: TEST_PLAN sections 1.1.5-1.1.8, 2.1-2.3

---

### Priority 3: Medium (Nice to Have)
- [ ] Minimap hover effects
- [ ] Minimap click navigation (if implemented)
- [ ] High-speed boundary collision handling
- [ ] Performance under load (many entities)

**Tests**: TEST_PLAN sections 2.4, 1.1.9, 2.5.2

---

## Essential Console Commands

### Position Verification
```javascript
// Check player position (should be 0-3000 x, 0-2000 y)
console.log('Player:', game.state.player.x, game.state.player.y);

// Teleport to corners for testing
game.state.player.x = 0; game.state.player.y = 0; // Top-left
game.state.player.x = 3000; game.state.player.y = 2000; // Bottom-right
game.state.player.x = 1500; game.state.player.y = 1000; // Center
```

### Boundary Stress Test
```javascript
// Try to set invalid position (should clamp to boundaries)
game.state.player.x = -100; // Should become 0
console.log('X after -100:', game.state.player.x);

game.state.player.x = 3500; // Should become 3000
console.log('X after 3500:', game.state.player.x);
```

### Entity Count
```javascript
console.log('Entities:', game.state.entities.length);
console.log('Projectiles:', game.state.projectiles.length);
```

---

## Pass/Fail Criteria

### ✅ **PASS** if:
1. Ships constrained to world boundaries (0-3000 x, 0-2000 y)
2. Minimap visible and updates in real-time
3. Player = green dot, Enemies = red dots, Asteroids = gray dots
4. Viewport rectangle visible on minimap
5. FPS stays above 55
6. No console errors or warnings
7. Smooth corner navigation (no stuttering)

### ❌ **FAIL** if:
1. Ships can escape world (x < 0, x > 3000, y < 0, y > 2000)
2. Wrapping behavior still present
3. Minimap not visible or not updating
4. Entities missing from minimap
5. FPS drops below 50 consistently
6. Console shows errors
7. Ships stutter or vibrate at boundaries

---

## Known Issues (Pre-Test)

### Current Server Configuration:
- **Server world size**: 1920x1080 (needs update to 3000x2000)
- **Client expects**: 3000x2000
- **Action required**: Update `server/game.js` line 22:
  ```javascript
  // OLD: this.worldSize = { width: 1920, height: 1080 };
  // NEW: this.worldSize = { width: 3000, height: 2000 };
  ```

### Current Boundary Behavior:
- **Current**: Ships and asteroids wrap around boundaries
- **Expected**: Ships and asteroids stop at boundaries
- **Action required**: Modify boundary handling in `server/game.js` lines 213-217

### Minimap Status:
- **Status**: Minimap class exists (`client/minimap.js`)
- **Integration**: May need to be integrated into renderer
- **Action required**: Verify minimap is instantiated and rendered

---

## Test Workflow

### Phase 1: Pre-Implementation Tests (Baseline)
1. Run current game
2. Verify wrapping behavior exists
3. Check if minimap renders (may not be integrated yet)
4. Document baseline performance (FPS)
5. Take baseline screenshots

### Phase 2: Post-Implementation Tests
1. **Quick Test** (QUICK_TEST_CHECKLIST.md)
   - Run 10-minute quick test
   - Verify critical features work
   - Document any immediate issues

2. **Visual Verification** (VISUAL_TEST_GUIDE.md)
   - Take screenshots at key locations
   - Verify visual appearance
   - Check color scheme and sizing

3. **Comprehensive Test** (TEST_PLAN_boundaries_minimap.md)
   - Run full 2.5-hour test suite
   - Document all findings
   - Fill out acceptance criteria

### Phase 3: Bug Fixes & Retesting
1. Document bugs using templates in TEST_PLAN
2. Fix critical/high priority bugs
3. Re-run failed test cases
4. Verify no regressions

### Phase 4: Final Acceptance
1. All critical tests pass
2. FPS performance acceptable
3. Visual quality approved
4. Sign-off completed

---

## Bug Reporting

When you find a bug, use this format:

```markdown
**Bug ID**: BND-XXX or MAP-XXX
**Severity**: Critical / High / Medium / Low
**Test Case**: [e.g., Test 1.1.1 from TEST_PLAN]

**Description**:
[Clear description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]

**Expected**: [What should happen]
**Actual**: [What happened]

**Console Output**:
[Paste any errors]

**Screenshot**: [Attach if applicable]
```

Save bug reports in: `BUGS_boundaries_minimap.md`

---

## Performance Benchmarks

### Target Performance:
- **FPS**: 60 fps (target), 55-60 fps (acceptable)
- **Entity Count**: 10-20 entities typical
- **Projectile Count**: 10-50 projectiles
- **Minimap Update Rate**: 60 Hz (every frame)

### Performance Test Scenarios:
1. **Low Load**: 5 entities, 5 projectiles → FPS should be 60
2. **Medium Load**: 10 entities, 20 projectiles → FPS 58-60
3. **High Load**: 20 entities, 50 projectiles → FPS 55-58

If FPS < 55 consistently, investigate:
- Minimap rendering optimization
- Entity culling
- Projectile pooling
- Canvas rendering bottlenecks

---

## File Dependencies

### Server Files:
- `server/game.js` - Game loop, boundary logic, world size
- `server/spatial-grid.js` - Collision detection (references world size)

### Client Files:
- `client/minimap.js` - Minimap system (200x200, world 3000x2000)
- `client/camera.js` - Camera system (world boundaries, clamping)
- `client/renderer.js` - Main rendering (needs minimap integration)
- `client/main.js` - Game initialization

### Test Files:
- `TEST_PLAN_boundaries_minimap.md` - Comprehensive test plan
- `QUICK_TEST_CHECKLIST.md` - Quick reference tests
- `VISUAL_TEST_GUIDE.md` - Visual testing guide
- `TESTING_README.md` - This file

---

## Recommended Test Order

1. **Day 1: Quick Tests**
   - Run QUICK_TEST_CHECKLIST.md
   - Verify basic functionality
   - Identify critical bugs

2. **Day 2: Visual Tests**
   - Follow VISUAL_TEST_GUIDE.md
   - Take screenshots
   - Document visual issues

3. **Day 3: Comprehensive Tests**
   - Run TEST_PLAN_boundaries_minimap.md sections 1-2
   - Test all boundary scenarios
   - Test all minimap features

4. **Day 4: Integration & Edge Cases**
   - Run TEST_PLAN sections 3-4
   - Console command testing
   - Performance testing

5. **Day 5: Regression & Final**
   - Re-test any fixed bugs
   - Final acceptance criteria check
   - Sign-off

---

## Additional Resources

### Code References:
- **Minimap Implementation**: `client/minimap.js` lines 1-351
- **Camera Boundaries**: `client/camera.js` lines 99-107
- **Server Boundaries**: `server/game.js` lines 213-217
- **Spatial Grid**: `server/spatial-grid.js` lines 13-20

### Documentation:
- Game Design Document (GDD) - Should reference 3000x2000 world
- Architecture Documentation - Client/Server sync

---

## Contact & Support

**Questions about testing?**
- Review test plan comments
- Check console command examples
- Refer to visual guide diagrams

**Found a bug not covered in test plan?**
- Document using bug report template
- Add to BUGS_boundaries_minimap.md
- Update test plan with new test case

---

## Version History

- **v1.0** (2025-10-03): Initial test documentation created
  - Comprehensive test plan (30+ test cases)
  - Quick test checklist (10-minute test)
  - Visual test guide (ASCII diagrams)
  - Testing README (this file)

---

## Sign-Off Checklist

**Before signing off on Boundaries & Minimap features:**

- [ ] All Priority 1 tests pass
- [ ] All Priority 2 tests pass (or documented exceptions)
- [ ] Performance meets benchmarks (FPS 55-60)
- [ ] No critical bugs
- [ ] High-priority bugs fixed or documented
- [ ] Screenshots taken and archived
- [ ] Test results documented
- [ ] Code reviewed for boundary/minimap logic
- [ ] Regression tests pass

**Tested By**: _______________________
**Date**: _______________________
**Result**: ✅ APPROVED / ❌ REJECTED / ⚠️ CONDITIONAL

**Signature**: _______________________

---

**End of Testing README**

For detailed test procedures, see individual test documents.
