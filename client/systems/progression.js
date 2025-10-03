/**
 * Player Progression System - XP, Levels, Unlocks, and Achievements
 * Provides long-term player retention through meaningful progression
 */

export class ProgressionSystem {
    constructor() {
        // Player data (would be synced with server)
        this.playerData = this.loadPlayerData() || {
            playerId: this.generatePlayerId(),
            username: 'Pilot_' + Math.floor(Math.random() * 9999),
            level: 1,
            xp: 0,
            totalXP: 0,
            credits: 1000,
            stats: {
                kills: 0,
                deaths: 0,
                assists: 0,
                damageDealt: 0,
                matchesPlayed: 0,
                matchesWon: 0,
                highestKillStreak: 0,
                playTime: 0
            },
            unlocks: {
                ships: ['Interceptor'], // Start with basic ship
                skins: ['default'],
                weapons: ['blaster'],
                abilities: [],
                titles: ['Rookie']
            },
            achievements: [],
            dailyProgress: {
                lastReset: Date.now(),
                challenges: [],
                loginStreak: 0,
                lastLogin: Date.now()
            },
            equipped: {
                ship: 'Interceptor',
                skin: 'default',
                weapon: 'blaster',
                title: 'Rookie'
            }
        };

        // Progression configuration
        this.xpTable = this.generateXPTable();
        this.unlockTree = this.defineUnlockTree();
        this.achievements = this.defineAchievements();
        this.dailyChallenges = this.generateDailyChallenges();

        // XP rewards
        this.xpRewards = {
            kill: 100,
            assist: 50,
            damagePerPoint: 1,
            win: 500,
            loss: 200,
            firstWinOfDay: 1000,
            challengeComplete: 300,
            achievementUnlock: 500,
            survivalBonus: 10 // per second alive
        };

        // Initialize UI
        this.initProgressionUI();
    }

    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate XP requirements for each level
     */
    generateXPTable() {
        const table = [];
        let totalXP = 0;

        for (let level = 1; level <= 50; level++) {
            // Exponential curve with some smoothing
            const xpRequired = Math.floor(100 * Math.pow(1.5, level / 10) * level);
            totalXP += xpRequired;
            table[level] = {
                xpRequired,
                totalXP
            };
        }

        return table;
    }

    /**
     * Define what unlocks at each level
     */
    defineUnlockTree() {
        return {
            2: { type: 'ship', item: 'Gunship', name: 'Gunship Unlocked!' },
            3: { type: 'ability', item: 'boost', name: 'Boost Ability' },
            5: { type: 'skin', item: 'carbon', name: 'Carbon Skin' },
            7: { type: 'weapon', item: 'plasma', name: 'Plasma Cannon' },
            10: { type: 'ship', item: 'Cruiser', name: 'Cruiser Unlocked!' },
            12: { type: 'title', item: 'Veteran', name: 'Veteran Title' },
            15: { type: 'skin', item: 'neon', name: 'Neon Skin' },
            18: { type: 'ability', item: 'shield', name: 'Shield Ability' },
            20: { type: 'weapon', item: 'missile', name: 'Homing Missiles' },
            25: { type: 'title', item: 'Ace', name: 'Ace Pilot Title' },
            30: { type: 'skin', item: 'golden', name: 'Golden Skin' },
            35: { type: 'ship', item: 'Dreadnought', name: 'Dreadnought Unlocked!' },
            40: { type: 'ability', item: 'cloak', name: 'Cloaking Device' },
            45: { type: 'title', item: 'Legend', name: 'Legendary Title' },
            50: { type: 'skin', item: 'galaxy', name: 'Galaxy Skin' }
        };
    }

    /**
     * Define achievements
     */
    defineAchievements() {
        return [
            {
                id: 'first_blood',
                name: 'First Blood',
                description: 'Get your first kill',
                condition: (stats) => stats.kills >= 1,
                xpReward: 500,
                icon: '🎯'
            },
            {
                id: 'sharpshooter',
                name: 'Sharpshooter',
                description: 'Get 100 kills',
                condition: (stats) => stats.kills >= 100,
                xpReward: 2000,
                icon: '🎯'
            },
            {
                id: 'survivor',
                name: 'Survivor',
                description: 'Win a match without dying',
                condition: (stats, lastMatch) => lastMatch && lastMatch.won && lastMatch.deaths === 0,
                xpReward: 3000,
                icon: '🛡️'
            },
            {
                id: 'killing_spree',
                name: 'Killing Spree',
                description: 'Get a 10 kill streak',
                condition: (stats) => stats.highestKillStreak >= 10,
                xpReward: 2500,
                icon: '🔥'
            },
            {
                id: 'dedicated',
                name: 'Dedicated Pilot',
                description: 'Play 100 matches',
                condition: (stats) => stats.matchesPlayed >= 100,
                xpReward: 5000,
                icon: '⭐'
            },
            {
                id: 'dominator',
                name: 'Dominator',
                description: 'Deal 1,000,000 total damage',
                condition: (stats) => stats.damageDealt >= 1000000,
                xpReward: 10000,
                icon: '💥'
            }
        ];
    }

    /**
     * Generate daily challenges (resets every 24h)
     */
    generateDailyChallenges() {
        const challengeTemplates = [
            { text: 'Get 10 kills', target: 10, type: 'kills', xp: 500 },
            { text: 'Deal 5000 damage', target: 5000, type: 'damage', xp: 500 },
            { text: 'Win 3 matches', target: 3, type: 'wins', xp: 750 },
            { text: 'Play 5 matches', target: 5, type: 'matches', xp: 400 },
            { text: 'Get 5 kill streak', target: 5, type: 'streak', xp: 600 },
            { text: 'Survive 10 minutes total', target: 600, type: 'survivalTime', xp: 500 }
        ];

        // Pick 3 random challenges
        const selected = [];
        const used = new Set();

        while (selected.length < 3) {
            const index = Math.floor(Math.random() * challengeTemplates.length);
            if (!used.has(index)) {
                used.add(index);
                selected.push({
                    ...challengeTemplates[index],
                    id: `daily_${index}_${Date.now()}`,
                    progress: 0,
                    completed: false
                });
            }
        }

        return selected;
    }

    /**
     * Initialize progression UI overlay
     */
    initProgressionUI() {
        // Create main progression container
        const container = document.createElement('div');
        container.id = 'progression-ui';
        container.style.cssText = `
            position: absolute;
            top: 10px;
            width: 100%;
            pointer-events: none;
            z-index: 90;
        `;

        // XP Bar
        const xpBar = document.createElement('div');
        xpBar.id = 'xp-bar';
        xpBar.style.cssText = `
            width: 400px;
            height: 30px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #00ffff;
            position: relative;
            overflow: hidden;
        `;

        const xpFill = document.createElement('div');
        xpFill.id = 'xp-fill';
        xpFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #00ffff, #00ff00);
            width: 0%;
            transition: width 0.5s ease-out;
        `;

        const xpText = document.createElement('div');
        xpText.id = 'xp-text';
        xpText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-family: Orbitron, monospace;
            font-weight: bold;
            font-size: 14px;
        `;

        xpBar.appendChild(xpFill);
        xpBar.appendChild(xpText);

        // Level display
        const levelDisplay = document.createElement('div');
        levelDisplay.id = 'level-display';
        levelDisplay.style.cssText = `
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            top: 45px;
            color: #00ffff;
            font-family: Orbitron, monospace;
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            text-shadow: 0 0 10px #00ffff;
        `;

        // Daily challenges panel
        const challengesPanel = document.createElement('div');
        challengesPanel.id = 'daily-challenges';
        challengesPanel.style.cssText = `
            position: absolute;
            right: 20px;
            top: 10px;
            width: 250px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ffff;
            padding: 10px;
            pointer-events: auto;
        `;

        container.appendChild(xpBar);
        container.appendChild(levelDisplay);
        container.appendChild(challengesPanel);
        document.body.appendChild(container);

        this.updateProgressionUI();
    }

    /**
     * Update progression UI elements
     */
    updateProgressionUI() {
        const xpBar = document.getElementById('xp-fill');
        const xpText = document.getElementById('xp-text');
        const levelDisplay = document.getElementById('level-display');
        const challengesPanel = document.getElementById('daily-challenges');

        if (xpBar && xpText && levelDisplay) {
            const currentLevel = this.playerData.level;
            const nextLevel = currentLevel + 1;
            const currentLevelXP = this.xpTable[currentLevel]?.totalXP || 0;
            const nextLevelXP = this.xpTable[nextLevel]?.xpRequired || 10000;
            const progress = (this.playerData.xp / nextLevelXP) * 100;

            xpBar.style.width = `${progress}%`;
            xpText.textContent = `${this.playerData.xp} / ${nextLevelXP} XP`;
            levelDisplay.textContent = `Level ${currentLevel}`;

            // Update title with player's equipped title
            levelDisplay.textContent += ` - ${this.playerData.equipped.title}`;
        }

        // Update daily challenges
        if (challengesPanel && this.playerData.dailyProgress.challenges) {
            let challengesHTML = '<h3 style="color: #00ffff; margin: 0 0 10px 0; font-size: 16px;">Daily Challenges</h3>';

            this.playerData.dailyProgress.challenges.forEach(challenge => {
                const progress = Math.min(100, (challenge.progress / challenge.target) * 100);
                const checkmark = challenge.completed ? '✅' : '⬜';

                challengesHTML += `
                    <div style="margin-bottom: 10px; opacity: ${challenge.completed ? 0.5 : 1};">
                        <div style="color: white; font-size: 12px; margin-bottom: 3px;">
                            ${checkmark} ${challenge.text}
                        </div>
                        <div style="background: rgba(255,255,255,0.2); height: 4px;">
                            <div style="background: ${challenge.completed ? '#00ff00' : '#00ffff'};
                                        width: ${progress}%; height: 100%; transition: width 0.3s;"></div>
                        </div>
                        <div style="color: #888; font-size: 10px; margin-top: 2px;">
                            ${challenge.progress}/${challenge.target} - ${challenge.xp} XP
                        </div>
                    </div>
                `;
            });

            challengesPanel.innerHTML = challengesHTML;
        }
    }

    /**
     * Add XP with animation
     * @param {number} amount - XP amount to add
     * @param {string} reason - Reason for XP gain
     */
    addXP(amount, reason = '') {
        const previousLevel = this.playerData.level;
        this.playerData.xp += amount;
        this.playerData.totalXP += amount;

        // Check for level up
        while (this.playerData.level < 50) {
            const nextLevelXP = this.xpTable[this.playerData.level + 1]?.xpRequired || Infinity;

            if (this.playerData.xp >= nextLevelXP) {
                this.playerData.xp -= nextLevelXP;
                this.playerData.level++;
                this.onLevelUp(this.playerData.level);
            } else {
                break;
            }
        }

        // Show XP gain notification
        this.showXPNotification(amount, reason);

        // Update UI
        this.updateProgressionUI();

        // Save data
        this.savePlayerData();
    }

    /**
     * Handle level up
     * @param {number} newLevel - New level reached
     */
    onLevelUp(newLevel) {
        // Check for unlocks
        const unlock = this.unlockTree[newLevel];
        if (unlock) {
            this.playerData.unlocks[unlock.type + 's'].push(unlock.item);
            this.showUnlockNotification(unlock);
        }

        // Show level up notification
        this.showLevelUpNotification(newLevel);

        // Award level up bonus
        this.playerData.credits += 100 * newLevel;
    }

    /**
     * Show XP gain notification
     */
    showXPNotification(amount, reason) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            left: 50%;
            top: 100px;
            transform: translateX(-50%);
            background: rgba(0, 255, 255, 0.2);
            border: 2px solid #00ffff;
            padding: 10px 20px;
            color: white;
            font-family: Orbitron, monospace;
            font-size: 16px;
            animation: xpNotification 2s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        `;
        notification.textContent = `+${amount} XP ${reason ? '- ' + reason : ''}`;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 2000);
    }

    /**
     * Show level up notification
     */
    showLevelUpNotification(level) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #00ffff, #00ff00);
            padding: 20px 40px;
            color: black;
            font-family: Orbitron, monospace;
            font-size: 32px;
            font-weight: bold;
            animation: levelUpPulse 3s ease-out forwards;
            pointer-events: none;
            z-index: 1001;
        `;
        notification.textContent = `LEVEL ${level}!`;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    /**
     * Show unlock notification
     */
    showUnlockNotification(unlock) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            left: 50%;
            top: 60%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.2);
            border: 2px solid gold;
            padding: 15px 30px;
            color: gold;
            font-family: Orbitron, monospace;
            font-size: 20px;
            animation: unlockBounce 3s ease-out forwards;
            pointer-events: none;
            z-index: 1001;
        `;
        notification.textContent = `🔓 UNLOCKED: ${unlock.name}`;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    /**
     * Update match stats
     */
    updateMatchStats(matchData) {
        // Update basic stats
        this.playerData.stats.kills += matchData.kills || 0;
        this.playerData.stats.deaths += matchData.deaths || 0;
        this.playerData.stats.assists += matchData.assists || 0;
        this.playerData.stats.damageDealt += matchData.damage || 0;
        this.playerData.stats.matchesPlayed++;

        if (matchData.won) {
            this.playerData.stats.matchesWon++;
        }

        // Update highest kill streak
        if (matchData.highestKillStreak > this.playerData.stats.highestKillStreak) {
            this.playerData.stats.highestKillStreak = matchData.highestKillStreak;
        }

        // Calculate XP rewards
        let totalXP = 0;
        totalXP += matchData.kills * this.xpRewards.kill;
        totalXP += matchData.assists * this.xpRewards.assist;
        totalXP += Math.floor(matchData.damage * this.xpRewards.damagePerPoint);
        totalXP += matchData.won ? this.xpRewards.win : this.xpRewards.loss;
        totalXP += Math.floor(matchData.survivalTime * this.xpRewards.survivalBonus);

        // Check daily challenges
        this.updateDailyChallenges(matchData);

        // Check achievements
        this.checkAchievements(matchData);

        // Add XP
        this.addXP(totalXP, 'Match Complete');

        // Save progress
        this.savePlayerData();
    }

    /**
     * Update daily challenge progress
     */
    updateDailyChallenges(matchData) {
        if (!this.playerData.dailyProgress.challenges) return;

        this.playerData.dailyProgress.challenges.forEach(challenge => {
            if (challenge.completed) return;

            let progress = 0;
            switch (challenge.type) {
                case 'kills':
                    progress = matchData.kills || 0;
                    break;
                case 'damage':
                    progress = matchData.damage || 0;
                    break;
                case 'wins':
                    progress = matchData.won ? 1 : 0;
                    break;
                case 'matches':
                    progress = 1;
                    break;
                case 'streak':
                    progress = matchData.highestKillStreak >= challenge.target ? challenge.target : 0;
                    break;
                case 'survivalTime':
                    progress = matchData.survivalTime || 0;
                    break;
            }

            challenge.progress = Math.min(challenge.target, challenge.progress + progress);

            if (challenge.progress >= challenge.target && !challenge.completed) {
                challenge.completed = true;
                this.addXP(challenge.xp, `Challenge: ${challenge.text}`);
            }
        });

        this.updateProgressionUI();
    }

    /**
     * Check and award achievements
     */
    checkAchievements(lastMatch) {
        this.achievements.forEach(achievement => {
            // Skip if already earned
            if (this.playerData.achievements.includes(achievement.id)) return;

            // Check condition
            if (achievement.condition(this.playerData.stats, lastMatch)) {
                this.playerData.achievements.push(achievement.id);
                this.addXP(achievement.xpReward, `Achievement: ${achievement.name}`);
                this.showAchievementNotification(achievement);
            }
        });
    }

    /**
     * Show achievement notification
     */
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 20px;
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            border: 3px solid #ffd700;
            padding: 15px;
            color: black;
            font-family: Orbitron, monospace;
            font-size: 16px;
            animation: achievementSlide 4s ease-out forwards;
            pointer-events: none;
            z-index: 1002;
            max-width: 300px;
        `;
        notification.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 5px;">${achievement.icon}</div>
            <div style="font-weight: bold;">ACHIEVEMENT UNLOCKED!</div>
            <div style="font-size: 18px; margin: 5px 0;">${achievement.name}</div>
            <div style="font-size: 12px; opacity: 0.8;">${achievement.description}</div>
            <div style="font-size: 14px; margin-top: 5px;">+${achievement.xpReward} XP</div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 4000);
    }

    /**
     * Reset daily challenges if needed
     */
    checkDailyReset() {
        const now = Date.now();
        const lastReset = this.playerData.dailyProgress.lastReset;
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (now - lastReset > oneDayMs) {
            this.playerData.dailyProgress.challenges = this.generateDailyChallenges();
            this.playerData.dailyProgress.lastReset = now;

            // Check login streak
            const lastLogin = this.playerData.dailyProgress.lastLogin;
            if (now - lastLogin < 2 * oneDayMs) {
                this.playerData.dailyProgress.loginStreak++;
                this.addXP(100 * this.playerData.dailyProgress.loginStreak, 'Login Streak Bonus');
            } else {
                this.playerData.dailyProgress.loginStreak = 1;
            }

            this.playerData.dailyProgress.lastLogin = now;
            this.savePlayerData();
            this.updateProgressionUI();
        }
    }

    /**
     * Save player data to localStorage
     */
    savePlayerData() {
        localStorage.setItem('stellarWarfare_playerData', JSON.stringify(this.playerData));
    }

    /**
     * Load player data from localStorage
     */
    loadPlayerData() {
        const saved = localStorage.getItem('stellarWarfare_playerData');
        return saved ? JSON.parse(saved) : null;
    }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent += `
    @keyframes xpNotification {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        20% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        80% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }

    @keyframes levelUpPulse {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
        }
        30% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        50% {
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }

    @keyframes unlockBounce {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        40% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 1;
        }
        60% {
            transform: translate(-50%, -50%) scale(0.9);
        }
        80% {
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
        }
    }

    @keyframes achievementSlide {
        0% {
            transform: translateX(400px);
            opacity: 0;
        }
        20% {
            transform: translateX(0);
            opacity: 1;
        }
        80% {
            transform: translateX(0);
            opacity: 1;
        }
        100% {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);