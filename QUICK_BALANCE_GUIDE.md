# Quick Balance Implementation Guide

## Current Status
✅ Fire rates have been partially adjusted (2.5x slower)
✅ Ship speeds reduced to Asteroids-style
✅ Projectile speeds reduced for visibility

## Immediate Actions Needed

### Option 1: Use the Balanced Config (Recommended)
Replace the current `ship-types.js` with `ship-types-balanced.js`:
```bash
# Backup current version
cp server/ship-types.js server/ship-types-original.js

# Apply balanced version
cp server/ship-types-balanced.js server/ship-types.js
```

### Option 2: Apply Final Tweaks to Current Config
The current fire rates are better but still too fast for optimal gameplay:

**Current vs Recommended:**
- Interceptor: 500ms (current) → 750ms (recommended)
- Gunship: 600ms (current) → 1000ms (recommended)
- Cruiser: 800ms (current) → 1500ms (recommended)

To apply these final adjustments, update `server/ship-types.js`:

```javascript
// Interceptor
fireRate: 750,           // Was 500, now truly deliberate
projectileDamage: 20,    // Increase from 15
projectileSpeed: 400,    // Increase from 300

// Gunship
fireRate: 1000,          // Was 600, now rhythmic 1 shot/sec
projectileDamage: 30,    // Increase from 25
projectileSpeed: 350,    // Increase from 250

// Cruiser
fireRate: 1500,          // Was 800, now cannon-like
projectileDamage: 50,    // Increase from 40
projectileSpeed: 300,    // Increase from 200
```

## Combat Feel Testing Checklist

After applying changes, test these scenarios:

1. **1v1 Interceptor Duel**
   - Should last 5-7 seconds
   - 3-4 well-placed shots to kill
   - Dodging should be viable

2. **Gunship vs Gunship**
   - Should last 8-10 seconds
   - Steady rhythm of shots
   - Positioning matters

3. **Cruiser Artillery**
   - Each shot should feel impactful
   - 3 hits should destroy most targets
   - Missing should be punishing

## Visual/Audio Enhancements (Next Steps)

1. Add muzzle flash (already has color in balanced config)
2. Increase projectile size based on damage
3. Add screen shake on hits
4. Different projectile sounds per ship class

## Quick A/B Test

Run both configs side-by-side:
- Server 1: Current partially-fixed config (Port 3001)
- Server 2: Fully balanced config (Port 3002)

Measure:
- Average combat duration
- Player retention after death
- Number of shots fired per minute
- Player feedback on "fun factor"

## Emergency Rollback

If combat becomes too slow:
```javascript
// In COMBAT_CONFIG (balanced version)
FIRE_RATE_MODIFIER: 0.75,  // 25% faster firing
DAMAGE_MODIFIER: 0.9,       // 10% less damage
```

This will fine-tune without losing the deliberate feel.