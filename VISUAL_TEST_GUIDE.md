# Visual Test Guide - Boundaries & Minimap

## World Layout (3000x2000 pixels)

```
(0,0)                                                    (3000,0)
  +--------------------------------------------------------+
  |                      TOP BOUNDARY                      |
  |                         (y=0)                          |
  |                                                        |
  |  L                                                  R  |
  |  E                    GAME WORLD                    I  |
  |  F                                                  G  |
  |  T                   3000 x 2000                    H  |
  |                                                     T  |
  |  B                                                     |
  |  O                                                  B  |
  |  U                    [Player Ship]                 O  |
  |  N    (1500, 1000)      CENTER                      U  |
  |  D                                                  N  |
  |  A    [Asteroid]  [Enemy Bot]  [Asteroid]          D  |
  |  R                                                  A  |
  |  Y                                                  R  |
  |                                                     Y  |
  | (x=0)                                           (x=3000)|
  |                                                        |
  |                    BOTTOM BOUNDARY                     |
  |                        (y=2000)                        |
  +--------------------------------------------------------+
(0,2000)                                              (3000,2000)
```

---

## Minimap Layout (200x200 pixels)

**Position**: Top-right corner of screen

```
                                        SCREEN
┌─────────────────────────────────────────────────────────┐
│ Player Info         FPS: 60                 [Minimap]   │
│ (10, 10)                                    ┌─────────┐ │
│                                             │ ▓▓▓▓▓▓▓ │ │
│                                             │ ▓░░░░░▓ │ │
│                                             │ ▓░●○░░▓ │ │ ← Minimap
│                                             │ ▓░░░░░▓ │ │   200x200px
│                                             │ ▓▓▓▓▓▓▓ │ │   20px padding
│                                             └─────────┘ │   from edges
│                                                         │
│                  GAME VIEW                              │
│                (Main Canvas)                            │
│                                                         │
│                    [Ship]                               │
│                                                         │
│         [Asteroid]         [Enemy]                      │
│                                                         │
│                                                         │
│ Controls:              [Asteroid]                       │
│ WASD - Move                                             │
│ Mouse - Aim            [Enemy]      [Asteroid]          │
│ Click - Fire                                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Minimap Legend:**
- `▓` = Border (cyan #00ffff)
- `░` = Background (semi-transparent black)
- `●` = Player (green dot, 4x4px)
- `○` = Enemy (red dot, 3x3px)
- `·` = Asteroid (gray dot, 2x2px)
- `□` = Viewport rectangle (cyan outline)

---

## Detailed Minimap View

```
┌────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Cyan border (2px)
│ ▓                            ▓ │
│ ▓  ┌──────────────────┐     ▓ │  ← Viewport rectangle
│ ▓  │ World (3000x2000)│     ▓ │    Shows camera view
│ ▓  │                  │     ▓ │
│ ▓  │  ·  · ·          │     ▓ │  ← Gray asteroids
│ ▓  │                  │     ▓ │
│ ▓  │    ●  ← Player   │     ▓ │  ← Green player (you)
│ ▓  │    ↑ (direction) │     ▓ │    With direction line
│ ▓  │                  │     ▓ │
│ ▓  │  ○    ○          │     ▓ │  ← Red enemies/bots
│ ▓  │                  │     ▓ │
│ ▓  │       ·   ·      │     ▓ │
│ ▓  └──────────────────┘     ▓ │
│ ▓                            ▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└────────────────────────────────┘
      200px x 200px
```

---

## Boundary Collision Scenarios

### 1. Ship Approaching Left Boundary

```
Before:                  During:                 After:
  BOUNDARY                BOUNDARY                BOUNDARY
     |                       |                       |
     |                       |→>|  (Ship stops)     |>|
     |                       |                       |
     |    >→                 |                       |
     |       (Ship           |                       |
     |        moving         |                       |
     |        left)          |                       |
   x=0                     x=0                     x=0

Expected: Ship velocity becomes 0 at x=0
```

### 2. Corner Collision (Top-Left)

```
     0      100     200
  0  +-------+-------+
     |CORNER |       |
     |   >→  |       |  ← Ship tries to move
 100 +-------+-------+     into corner
     |       |       |
     |       |       |
 200 +-------+-------+

Result: Ship should be at (0, 0)
        Ship should not "stick" or vibrate
        Ship can still rotate freely
```

### 3. Projectile at Boundary

**Option A: Projectile Disappears**
```
  BOUNDARY
     |
     | →* (projectile hits, disappears)
     |
     |
```

**Option B: Projectile Bounces**
```
  BOUNDARY
     |
     | →*  (projectile hits)
     |
     | *←  (bounces back)
     |
```

---

## Minimap Scale Test Points

### Test coordinate mapping accuracy:

```
World Position        →  Minimap Position
─────────────────────────────────────────────
(0, 0)       Top-Left   →  (minimapX, minimapY)
(3000, 0)    Top-Right  →  (minimapX+200, minimapY)
(0, 2000)    Bot-Left   →  (minimapX, minimapY+200)
(3000, 2000) Bot-Right  →  (minimapX+200, minimapY+200)
(1500, 1000) Center     →  (minimapX+100, minimapY+100)

Scale Factors:
- scaleX = 200 / 3000 = 0.0667
- scaleY = 200 / 2000 = 0.1000
```

### Visual Test Pattern:

```
Navigate to each point in order:

   1 ─────── 2
   │         │
   │    5    │   5 = Center (1500, 1000)
   │         │
   3 ─────── 4

1. (0, 0)          - Top-left corner
2. (3000, 0)       - Top-right corner
3. (0, 2000)       - Bottom-left corner
4. (3000, 2000)    - Bottom-right corner
5. (1500, 1000)    - Center

Watch minimap: Green dot should reach each corner precisely
```

---

## Viewport Rectangle Test

### Zoomed Out (zoom = 0.8):
```
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓ ┌──────────────┐ ▓ │  ← Large rectangle
│ ▓ │              │ ▓ │    (more world visible)
│ ▓ │              │ ▓ │
│ ▓ │      ●       │ ▓ │
│ ▓ │              │ ▓ │
│ ▓ │              │ ▓ │
│ ▓ └──────────────┘ ▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────┘
```

### Normal (zoom = 1.0):
```
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓   ┌──────────┐   ▓ │  ← Medium rectangle
│ ▓   │          │   ▓ │
│ ▓   │          │   ▓ │
│ ▓   │    ●     │   ▓ │
│ ▓   │          │   ▓ │
│ ▓   │          │   ▓ │
│ ▓   └──────────┘   ▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────┘
```

### Zoomed In (zoom = 1.5):
```
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓      ┌────┐      ▓ │  ← Small rectangle
│ ▓      │    │      ▓ │    (less world visible)
│ ▓      │    │      ▓ │
│ ▓      │ ●  │      ▓ │
│ ▓      │    │      ▓ │
│ ▓      │    │      ▓ │
│ ▓      └────┘      ▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────┘
```

**Expected**: Rectangle size inversely proportional to zoom

---

## Boundary Visual Indicators

### Expected Boundary Rendering:

```
┌────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Top boundary line
▓                                        ▓
▓                                        ▓
▓   Game World                           ▓
▓                                        ▓
▓   Stars, Ships, Asteroids              ▓
▓                                        ▓
▓                                        ▓
▓                                        ▓
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← Bottom boundary
└────────────────────────────────────────┘
 ↑                                      ↑
Left                                   Right
boundary                            boundary
```

**Boundary Properties:**
- Color: Cyan (#00ffff) or similar
- Width: 2-5 pixels
- Opacity: Semi-transparent (0.5-0.8)
- Visible from distance (should see when approaching)

---

## Entity Colors Reference

### On Main Canvas:
- **Player Ship**: Green outline/engines (#00ff00)
- **Enemy Ships**: Red outline/engines (#ff0000)
- **Asteroids**: Gray/Brown (#888888)
- **Projectiles**: Bright white/cyan (#ffffff or #00ffff)
- **Boundaries**: Cyan lines (#00ffff)

### On Minimap:
- **Player**: Bright green dot, 4x4px (#00ff00)
- **Enemies**: Red dots, 3x3px (#ff0000)
- **Asteroids**: Gray dots, 2x2px (#888888)
- **Projectiles**: White dots, 1x1px (#ffffff) - optional
- **Viewport**: Cyan rectangle, semi-transparent (rgba(0,255,255,0.3))
- **Border**: Solid cyan, 2px (#00ffff)
- **Background**: Semi-transparent black (rgba(0,0,0,0.5))

---

## Screenshot Locations

Take screenshots at these locations for documentation:

1. **Center of world** (1500, 1000)
   - Shows normal gameplay
   - Minimap centered

2. **Top-left corner** (0, 0)
   - Shows boundary collision
   - Minimap dot at top-left

3. **Bottom-right corner** (3000, 2000)
   - Shows boundary collision
   - Minimap dot at bottom-right

4. **Near left boundary** (~50, 1000)
   - Shows boundary visual indicator
   - About to hit boundary

5. **Minimap closeup**
   - Full screen capture
   - Highlight minimap area
   - Show all entity types

---

## Common Visual Bugs to Check

### ❌ Bad Behaviors:

1. **Ship Wrapping**:
```
   BOUNDARY              BOUNDARY
      |                     |
      | →>→              ←< |  ← Ship wraps to opposite side
      |                     |
     BAD!
```

2. **Minimap Dot Disappearing**:
```
┌──────────┐
│ ▓▓▓▓▓▓ │
│ ▓    ▓ │  ← Player green dot missing
│ ▓  · ▓ │     (should always be visible)
│ ▓▓▓▓▓▓ │
└──────────┘
   BAD!
```

3. **Viewport Rectangle Outside Minimap**:
```
┌──────────┐  ┌─────┐
│ ▓▓▓▓▓▓ │  │     │ ← Rectangle not clipped
│ ▓  ● ▓ │  │     │    to minimap bounds
│ ▓    ▓ │  └─────┘
│ ▓▓▓▓▓▓ │
└──────────┘
   BAD!
```

4. **Ship Stuck in Corner**:
```
+───
|###   ← Ship vibrating/stuttering
|###      in corner (bad collision)
|
  BAD!
```

### ✅ Good Behaviors:

1. **Clean Boundary Stop**:
```
   BOUNDARY
      |
      |>|  ← Ship stopped cleanly at x=0
      |       No overshoot, no vibration
    GOOD!
```

2. **Smooth Corner Navigation**:
```
+───────
| >→     ← Ship glides smoothly
|           along boundary
|
  GOOD!
```

3. **Accurate Minimap Tracking**:
```
Ship at (1500, 1000) → Green dot at minimap center
Ship at (0, 0)       → Green dot at minimap top-left
Ship at (3000, 2000) → Green dot at minimap bottom-right
  GOOD!
```

---

## Performance Visual Check

### FPS Counter Monitoring:

```
┌─────────────────┐
│ FPS: 60         │  ← Should stay 55-60 fps
│ Position: ...   │
│ Velocity: ...   │
└─────────────────┘

Monitor during:
- Normal gameplay: 60 fps
- Near boundaries: 60 fps (no drop)
- Viewing minimap: 60 fps
- Many entities: 55-60 fps

❌ If FPS < 50: Performance issue!
```

---

## Quick Visual Test Workflow

1. **Start game** → Check minimap appears (top-right)
2. **Move to center** → Green dot at minimap center
3. **Move to left boundary** → Ship stops, green dot at left edge
4. **Move to right boundary** → Ship stops, green dot at right edge
5. **Move to top** → Ship stops, green dot at top
6. **Move to bottom** → Ship stops, green dot at bottom
7. **Return to center** → All smooth, FPS stable
8. **Fire projectiles at boundaries** → Projectiles stop/bounce
9. **Observe bots** → Red dots track bots on minimap
10. **Watch asteroids** → Gray dots visible on minimap

**Total time**: 3-5 minutes for visual confirmation

---

## Debug Overlay (Optional)

If implementing debug mode, show:

```
┌─────────────────────────────────────┐
│ DEBUG MODE                          │
│ ─────────────────────────────────── │
│ Player: (1234, 567)                 │
│ Velocity: (45, -23)                 │
│ At Boundary: No                     │
│ Entities: 12                        │
│ Projectiles: 5                      │
│ FPS: 60                             │
│ Minimap Scale: 0.067 x 0.100        │
│ Camera Zoom: 1.0                    │
└─────────────────────────────────────┘
```

Press `F3` or `~` to toggle debug mode (suggestion)

---

## Test Completion Visual Checklist

Print this section and check off each item:

**Boundaries:**
- [ ] ✅ Boundaries visible (cyan lines)
- [ ] ✅ Ship stops at all 4 edges
- [ ] ✅ No wrapping behavior
- [ ] ✅ Smooth corner navigation
- [ ] ✅ Projectiles stop at boundaries

**Minimap:**
- [ ] ✅ Minimap visible (top-right, 200x200px)
- [ ] ✅ Cyan border present
- [ ] ✅ Green player dot visible
- [ ] ✅ Red enemy dots visible
- [ ] ✅ Gray asteroid dots visible
- [ ] ✅ Viewport rectangle visible
- [ ] ✅ Green dot tracks player smoothly
- [ ] ✅ Direction indicator shows ship angle

**Performance:**
- [ ] ✅ FPS stays above 55
- [ ] ✅ No visual glitches
- [ ] ✅ No stuttering at boundaries

**Sign-off:** ________________  Date: __________
