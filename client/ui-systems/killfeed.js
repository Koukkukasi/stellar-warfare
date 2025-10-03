/**
 * Kill Feed System - Shows recent kills and combat events
 * Displays player eliminations, multi-kills, and special achievements
 */

export class KillFeed {
    constructor() {
        this.entries = [];
        this.maxEntries = 5;
        this.entryLifetime = 5000; // 5 seconds
        this.fadeOutDuration = 1000; // 1 second fade

        // Multi-kill tracking
        this.killStreak = 0;
        this.lastKillTime = 0;
        this.multiKillWindow = 3000; // 3 seconds for multi-kills

        // Visual settings
        this.x = 20;
        this.y = 200;
        this.entryHeight = 30;
        this.entrySpacing = 5;

        // Streak messages
        this.streakMessages = {
            2: { text: 'DOUBLE KILL!', color: '#ffaa00' },
            3: { text: 'TRIPLE KILL!', color: '#ff6600' },
            4: { text: 'QUAD KILL!', color: '#ff3300' },
            5: { text: 'PENTA KILL!', color: '#ff0000' },
            6: { text: 'LEGENDARY!', color: '#ff00ff' }
        };

        // Initialize DOM container
        this.initDOM();
    }

    initDOM() {
        // Create kill feed container
        this.container = document.createElement('div');
        this.container.id = 'killfeed';
        this.container.style.cssText = `
            position: absolute;
            left: ${this.x}px;
            top: ${this.y}px;
            width: 350px;
            pointer-events: none;
            z-index: 100;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * Add a kill event to the feed
     * @param {string} killer - Name of player who got the kill
     * @param {string} victim - Name of player who was eliminated
     * @param {string} weapon - Weapon type used
     * @param {boolean} isPlayer - Whether the killer is the local player
     */
    addKill(killer, victim, weapon = 'Blaster', isPlayer = false) {
        const now = Date.now();

        // Check for multi-kill
        if (isPlayer) {
            if (now - this.lastKillTime < this.multiKillWindow) {
                this.killStreak++;
            } else {
                this.killStreak = 1;
            }
            this.lastKillTime = now;

            // Add streak announcement if applicable
            if (this.killStreak >= 2 && this.streakMessages[this.killStreak]) {
                this.addStreakAnnouncement(this.killStreak);
            }
        }

        // Create kill entry
        const entry = {
            id: `kill-${Date.now()}-${Math.random()}`,
            killer,
            victim,
            weapon,
            timestamp: now,
            isPlayer,
            type: 'kill'
        };

        this.entries.unshift(entry);

        // Limit entries
        if (this.entries.length > this.maxEntries) {
            const removed = this.entries.pop();
            this.removeEntryDOM(removed.id);
        }

        this.renderEntry(entry);
        this.startEntryTimer(entry);
    }

    /**
     * Add a streak announcement
     * @param {number} streak - Kill streak count
     */
    addStreakAnnouncement(streak) {
        const streakData = this.streakMessages[Math.min(streak, 6)];

        const entry = {
            id: `streak-${Date.now()}`,
            text: streakData.text,
            color: streakData.color,
            timestamp: Date.now(),
            type: 'streak'
        };

        this.entries.unshift(entry);

        // Remove oldest if at max
        if (this.entries.length > this.maxEntries) {
            const removed = this.entries.pop();
            this.removeEntryDOM(removed.id);
        }

        this.renderStreakEntry(entry);
        this.startEntryTimer(entry);
    }

    /**
     * Render a kill entry to DOM
     * @param {Object} entry - Kill entry data
     */
    renderEntry(entry) {
        const div = document.createElement('div');
        div.id = entry.id;
        div.className = 'killfeed-entry';

        // Different styling for player kills
        const killerColor = entry.isPlayer ? '#00ff00' : '#ffffff';
        const bgColor = entry.isPlayer ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)';

        div.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 12px;
            margin-bottom: ${this.entrySpacing}px;
            background: ${bgColor};
            border-left: 3px solid ${killerColor};
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            color: white;
            animation: slideIn 0.3s ease-out;
            transition: opacity ${this.fadeOutDuration}ms ease-out;
        `;

        // Create entry content
        div.innerHTML = `
            <span style="color: ${killerColor}; font-weight: bold;">${entry.killer}</span>
            <span style="margin: 0 8px; color: #888;">
                <svg width="20" height="20" viewBox="0 0 24 24" style="vertical-align: middle;">
                    <path fill="#ff4444" d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                </svg>
            </span>
            <span style="color: #ff6666;">${entry.victim}</span>
            <span style="margin-left: auto; color: #666; font-size: 12px;">${entry.weapon}</span>
        `;

        // Add to container at the top
        this.container.insertBefore(div, this.container.firstChild);

        // Trigger animation
        requestAnimationFrame(() => {
            div.style.opacity = '1';
        });
    }

    /**
     * Render a streak announcement
     * @param {Object} entry - Streak entry data
     */
    renderStreakEntry(entry) {
        const div = document.createElement('div');
        div.id = entry.id;
        div.className = 'killfeed-streak';

        div.style.cssText = `
            padding: 12px;
            margin-bottom: ${this.entrySpacing}px;
            background: linear-gradient(90deg, ${entry.color}22, transparent);
            border-left: 4px solid ${entry.color};
            font-family: 'Orbitron', monospace;
            font-size: 18px;
            font-weight: bold;
            color: ${entry.color};
            text-align: center;
            text-shadow: 0 0 10px ${entry.color};
            animation: streakPulse 0.5s ease-out;
            transition: opacity ${this.fadeOutDuration}ms ease-out;
        `;

        div.textContent = entry.text;

        // Add to container
        this.container.insertBefore(div, this.container.firstChild);
    }

    /**
     * Start timer to remove entry
     * @param {Object} entry - Entry to remove after lifetime
     */
    startEntryTimer(entry) {
        setTimeout(() => {
            const element = document.getElementById(entry.id);
            if (element) {
                element.style.opacity = '0';
                setTimeout(() => {
                    this.removeEntryDOM(entry.id);
                    this.entries = this.entries.filter(e => e.id !== entry.id);
                }, this.fadeOutDuration);
            }
        }, this.entryLifetime);
    }

    /**
     * Remove entry from DOM
     * @param {string} id - Entry ID to remove
     */
    removeEntryDOM(id) {
        const element = document.getElementById(id);
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    /**
     * Clear all entries
     */
    clear() {
        this.entries = [];
        this.container.innerHTML = '';
        this.killStreak = 0;
        this.lastKillTime = 0;
    }

    /**
     * Update feed (remove expired entries)
     */
    update() {
        const now = Date.now();
        this.entries = this.entries.filter(entry => {
            if (now - entry.timestamp > this.entryLifetime + this.fadeOutDuration) {
                this.removeEntryDOM(entry.id);
                return false;
            }
            return true;
        });
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

    @keyframes slideIn {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes streakPulse {
        0% {
            transform: scale(0.8);
            opacity: 0;
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    .killfeed-entry:hover {
        transform: translateX(5px);
    }
`;
document.head.appendChild(style);