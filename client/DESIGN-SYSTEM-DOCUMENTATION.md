# Stellar Warfare Design System Documentation

## Overview
A comprehensive retro-futuristic design system for Stellar Warfare, combining terminal aesthetics with modern gaming UI patterns. The system prioritizes performance, accessibility, and visual consistency across all game interfaces.

## Table of Contents
1. [Color System](#color-system)
2. [Typography](#typography)
3. [Animation Library](#animation-library)
4. [Component Framework](#component-framework)
5. [Particle Effects](#particle-effects)
6. [Responsive Design](#responsive-design)
7. [Implementation Guide](#implementation-guide)
8. [Performance Optimization](#performance-optimization)
9. [Accessibility Guidelines](#accessibility-guidelines)

---

## Color System

### Primary Palette
```css
--color-primary: #00ff41;        /* Matrix Green - Main UI elements */
--color-primary-bright: #39ff14; /* Neon Green - Active states */
--color-primary-dim: #00cc33;    /* Forest Green - Inactive states */
```

### Secondary Palette
```css
--color-secondary: #00d4ff;      /* Cyan - Energy/shields */
--color-secondary-bright: #00ffff; /* Bright Cyan - Full energy */
--color-secondary-dim: #0099cc;   /* Deep Cyan - Low energy */
```

### Accent Colors
```css
--color-accent: #ff00ff;          /* Magenta - Power-ups */
--color-accent-bright: #ff44ff;   /* Hot Pink - Active power-ups */
--color-accent-dim: #cc00cc;      /* Purple - Expired power-ups */
```

### Status Colors
```css
--color-danger: #ff0040;          /* Red - Damage/Critical */
--color-warning: #ffaa00;         /* Orange - Caution */
--color-success: #00ff88;         /* Mint - Success/Healing */
--color-info: #8800ff;            /* Purple - Information */
```

### Usage Guidelines
- **Primary Green**: Use for main UI elements, text, borders
- **Cyan**: Use for energy systems, shields, defensive elements
- **Magenta**: Use for special items, power-ups, rare events
- **Red**: Use sparingly for critical warnings, damage indicators
- **Orange**: Use for low resource warnings, caution states

---

## Typography

### Font Stack
```css
--font-mono: 'Courier New', 'Monaco', 'Consolas', monospace;
--font-display: 'Orbitron', 'Rajdhani', var(--font-mono);
```

### Type Scale
| Size | Variable | Pixels | Use Case |
|------|----------|--------|----------|
| XXS | `--font-size-xxs` | 10px | Sub-labels, hints |
| XS | `--font-size-xs` | 12px | Secondary text |
| SM | `--font-size-sm` | 14px | Body text |
| Base | `--font-size-base` | 16px | Default UI text |
| LG | `--font-size-lg` | 18px | Subtitles |
| XL | `--font-size-xl` | 24px | Section headers |
| 2XL | `--font-size-2xl` | 32px | Page titles |
| 3XL | `--font-size-3xl` | 48px | Hero text |
| 4XL | `--font-size-4xl` | 64px | Display text |

### Implementation Example
```html
<h1 class="text-2xl font-bold glow-primary">STELLAR WARFARE</h1>
<p class="text-base text-gray">Enter the battleground</p>
<span class="text-xs text-muted uppercase">Version 1.0.0</span>
```

---

## Animation Library

### Combat Animations

#### Explosion Effect
```javascript
// Trigger explosion animation
particleSystem.createExplosion(x, y, {
    count: 30,
    color: '#ff4400',
    size: 3,
    speed: 200,
    life: 0.8
});
```
```css
.explosion {
    animation: explosion 0.5s ease-out forwards;
}
```

#### Shield Hit
```javascript
particleSystem.createShieldHit(x, y, {
    color: '#00ffff',
    size: 5,
    life: 0.5
});
```
```css
.shield-hit {
    animation: shield-hit 0.3s ease-out;
}
```

### UI Animations

#### Modal Transitions
```css
.modal {
    animation: modal-slide-up 0.3s ease-out;
}
.modal-overlay {
    animation: fade-in 0.3s ease-out;
}
```

#### Notification Slide
```css
.notification {
    animation: notification-slide-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Animation Timing Reference
| Duration | Variable | Milliseconds | Use Case |
|----------|----------|--------------|----------|
| Instant | `--duration-instant` | 50ms | Micro-interactions |
| Fast | `--duration-fast` | 150ms | Hover states |
| Normal | `--duration-normal` | 300ms | Transitions |
| Slow | `--duration-slow` | 500ms | Complex animations |
| Slower | `--duration-slower` | 1000ms | Loading states |

### Easing Functions
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
```

---

## Component Framework

### HUD System

#### Basic HUD Setup
```javascript
import { HUD } from './ui-components.js';

const hud = new HUD('#game-container');

// Update health display
hud.updatePanel('top-left', {
    health: 85,
    shields: 100,
    energy: 75
});

// Add custom panel
const radarPanel = hud.createPanel('radar', {
    position: 'top-right',
    className: 'radar-panel'
});
```

#### HUD Panel Styling
```html
<div class="hud-panel">
    <div class="hud-label">SHIELDS</div>
    <div class="hud-value text-secondary glow-secondary">100%</div>
</div>
```

### Modal Dialogs

#### Confirmation Dialog
```javascript
const confirmed = await UI.confirm('Launch nuclear strike?', {
    title: 'CONFIRM ACTION',
    confirmText: 'LAUNCH',
    cancelText: 'ABORT'
});
```

#### Custom Modal
```javascript
const modal = new Modal({
    title: 'MISSION COMPLETE',
    content: '<p>You have defeated the enemy fleet!</p>',
    buttons: [
        {
            text: 'CONTINUE',
            className: 'btn btn-primary',
            onClick: () => nextMission()
        }
    ]
});
modal.open();
```

### Notifications

#### Success Notification
```javascript
UI.notify.success('Power-up collected!', {
    duration: 3000,
    position: 'top-right'
});
```

#### Warning with Custom Styling
```javascript
new Notification({
    type: 'warning',
    title: 'LOW FUEL',
    message: 'Return to base immediately',
    duration: 5000,
    className: 'pulse'
});
```

### Progress Indicators

#### Health Bar
```javascript
const healthBar = new ProgressBar('#health-container', {
    value: 100,
    max: 100,
    showLabel: true,
    labelFormat: (val, max) => `${val}/${max} HP`,
    colorSteps: {
        30: 'danger',
        60: 'warning',
        100: 'success'
    }
});

// Update health
healthBar.setValue(75);
```

#### Shield Meter
```javascript
const shieldMeter = new Meter('#shield-container', {
    value: 100,
    max: 100,
    radius: 30,
    colorSteps: {
        25: '#ff0040',
        50: '#ffaa00',
        100: '#00d4ff'
    },
    valueFormat: (val) => `${val}%`
});
```

### Loading Screens

#### Basic Loading
```javascript
const loader = UI.createLoadingScreen({
    message: 'Initializing systems...',
    type: 'spinner'
});
loader.show();

// Update progress
loader.setProgress(50);
loader.setMessage('Loading assets...');

// Hide when done
loader.hide();
```

---

## Particle Effects

### System Initialization
```javascript
import { ParticleSystem } from './particles.js';

const canvas = document.getElementById('gameCanvas');
const particles = new ParticleSystem(canvas);

// In game loop
function gameLoop() {
    particles.update();
    particles.render();
    requestAnimationFrame(gameLoop);
}
```

### Effect Catalog

#### Explosion
```javascript
particles.createExplosion(x, y, {
    count: 40,
    color: '#ff4400',
    secondaryColor: '#ffaa00',
    size: 4,
    speed: 250,
    life: 1.0,
    gravity: 100
});
```

#### Laser Impact
```javascript
particles.createLaserHit(x, y, angle, {
    count: 15,
    color: '#00ff41',
    size: 2,
    speed: 100,
    life: 0.4
});
```

#### Thruster Exhaust
```javascript
// Continuous effect
const thrusterEmitter = new ParticleEmitter({
    x: shipX,
    y: shipY,
    rate: 60,
    particleConfig: {
        color: ['#00d4ff', '#ffffff'],
        size: { min: 2, max: 4 },
        speed: { min: 40, max: 60 },
        life: { min: 0.2, max: 0.4 },
        fade: true,
        glow: true
    }
});
particles.addEmitter(thrusterEmitter);
thrusterEmitter.start();
```

#### Power-up Collection
```javascript
particles.createPowerupCollect(x, y, {
    count: 20,
    color: '#ff00ff',
    size: 3,
    speed: 150,
    life: 1
});
```

### Performance Optimization
```javascript
// Check particle count
const activeCount = particles.getActiveParticleCount();
if (activeCount > 500) {
    // Reduce quality settings
}

// Clear all particles
particles.clear();
```

---

## Responsive Design

### Breakpoints
```css
/* Mobile First */
@media (min-width: 640px) { /* Small tablets */ }
@media (min-width: 768px) { /* Tablets */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
```

### Responsive Utilities
```html
<!-- Text size responsive -->
<h1 class="text-lg sm:text-xl md:text-2xl lg:text-3xl">STELLAR WARFARE</h1>

<!-- Padding responsive -->
<div class="p-sm md:p-md lg:p-lg xl:p-xl">
    Content
</div>
```

### Touch-Friendly Controls
```css
/* Minimum touch target size */
.btn {
    min-width: 44px;
    min-height: 44px;
}

/* Increased hit areas on mobile */
@media (max-width: 768px) {
    .btn {
        padding: var(--spacing-md);
    }
}
```

---

## Implementation Guide

### 1. Include Core Files
```html
<!DOCTYPE html>
<html>
<head>
    <!-- Design System CSS -->
    <link rel="stylesheet" href="styles/design-system.css">
    <link rel="stylesheet" href="styles/animations.css">
</head>
<body>
    <!-- Game Canvas -->
    <canvas id="gameCanvas"></canvas>

    <!-- Scripts -->
    <script type="module" src="particles.js"></script>
    <script type="module" src="ui-components.js"></script>
    <script type="module" src="main.js"></script>
</body>
</html>
```

### 2. Initialize Systems
```javascript
// main.js
import { ParticleSystem } from './particles.js';
import { UI, HUD } from './ui-components.js';

// Initialize particle system
const canvas = document.getElementById('gameCanvas');
const particles = new ParticleSystem(canvas);

// Initialize HUD
const hud = new HUD(document.body);

// Create loading screen
const loader = UI.createLoadingScreen({
    message: 'Initializing Stellar Warfare...'
});
loader.show();

// Initialize game
async function init() {
    // Load assets
    loader.setMessage('Loading assets...');
    loader.setProgress(25);

    // Setup complete
    loader.setProgress(100);
    setTimeout(() => loader.hide(), 500);
}
```

### 3. Apply Theme Classes
```html
<!-- Primary button -->
<button class="btn btn-primary glow-primary">
    LAUNCH
</button>

<!-- Danger panel -->
<div class="hud-panel danger box-glow-danger">
    <span class="text-danger">CRITICAL DAMAGE</span>
</div>

<!-- Success notification -->
<div class="notification success">
    Mission Complete!
</div>
```

---

## Performance Optimization

### GPU Acceleration
```css
/* Force GPU acceleration */
.animated-element {
    will-change: transform;
    transform: translateZ(0);
}

/* Optimize animations */
.particle {
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
}
```

### Particle Pooling
```javascript
// Reuse particle objects
const pool = new ParticlePool(1000); // Pre-allocate 1000 particles

// Get particle from pool
const particle = pool.get();

// Return to pool when done
pool.release(particle);
```

### Animation Performance
```css
/* Use transform instead of position */
.moving-element {
    transform: translateX(100px); /* Good */
    /* left: 100px; */ /* Avoid */
}

/* Batch animations */
.multi-animate {
    animation:
        fade-in 0.3s,
        scale-up 0.3s,
        rotate 1s;
}
```

### Resource Management
```javascript
// Clean up unused components
modal.destroy();
notification.close();
particles.clear();

// Throttle updates
let lastUpdate = 0;
function update(timestamp) {
    if (timestamp - lastUpdate < 16) return; // 60 FPS cap
    lastUpdate = timestamp;

    // Update logic
}
```

---

## Accessibility Guidelines

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Critical information not conveyed by color alone
- Status indicators use both color and icons/text

### Keyboard Navigation
```css
/* Focus indicators */
*:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* Skip links */
.skip-link:focus {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
}
```

### Screen Reader Support
```html
<!-- ARIA labels -->
<button aria-label="Launch missile" class="btn">
    <span aria-hidden="true">🚀</span>
    FIRE
</button>

<!-- Live regions -->
<div aria-live="polite" aria-atomic="true">
    <span class="notification">Shield depleted</span>
</div>
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
    :root {
        --color-primary: #00ff00;
        --color-danger: #ff0000;
        /* Increased contrast values */
    }
}
```

---

## Quick Reference

### Common Patterns

#### Glowing Text
```html
<span class="text-primary glow-primary">SHIELDS ONLINE</span>
```

#### Pulsing Alert
```html
<div class="alert danger animate-pulse animate-infinite">
    HULL BREACH DETECTED
</div>
```

#### Loading Progress
```javascript
const progress = new ProgressBar(container, {
    max: 100,
    showLabel: true,
    className: 'loading-bar'
});
```

#### Victory Animation
```javascript
particles.createExplosion(centerX, centerY, {
    count: 100,
    color: '#00ff41',
    size: 5,
    speed: 300,
    life: 2
});

UI.notify.success('VICTORY!', {
    duration: 5000,
    className: 'victory-notification animate-bounce'
});
```

### CSS Variables Quick List
```css
/* Colors */
var(--color-primary)
var(--color-secondary)
var(--color-accent)
var(--color-danger)
var(--color-warning)
var(--color-success)

/* Spacing */
var(--spacing-xs)  /* 4px */
var(--spacing-sm)  /* 8px */
var(--spacing-md)  /* 16px */
var(--spacing-lg)  /* 24px */
var(--spacing-xl)  /* 32px */

/* Animation */
var(--duration-fast)    /* 150ms */
var(--duration-normal)  /* 300ms */
var(--duration-slow)    /* 500ms */
var(--ease-out)
var(--ease-bounce)
```

---

## Credits
Design System created for Stellar Warfare
Version 1.0.0
© 2024 Stellar Warfare Development Team