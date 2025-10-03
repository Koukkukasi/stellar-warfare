/**
 * Interactive Tutorial System - Onboarding new players with guided gameplay
 * Progressive introduction to game mechanics with visual cues and rewards
 */

export class TutorialSystem {
    constructor(game, renderer, inputHandler) {
        this.game = game;
        this.renderer = renderer;
        this.inputHandler = inputHandler;

        // Tutorial state
        this.isActive = false;
        this.currentStep = 0;
        this.stepCompleted = false;
        this.startTime = Date.now();

        // Tutorial steps
        this.steps = [
            {
                id: 'welcome',
                title: 'Welcome to Stellar Warfare!',
                description: 'Complete this tutorial to learn the basics and earn 1000 XP!',
                objective: null,
                duration: 3000,
                skipable: true
            },
            {
                id: 'movement',
                title: 'Movement Controls',
                description: 'Use WASD keys to move your ship',
                objective: { type: 'move', distance: 100 },
                hint: 'W - Forward, S - Backward, A - Left, D - Right',
                highlight: ['w', 'a', 's', 'd']
            },
            {
                id: 'aiming',
                title: 'Aiming',
                description: 'Move your mouse to aim your ship',
                objective: { type: 'aim', angles: 8 },
                hint: 'Your ship will always face your cursor',
                showCursor: true
            },
            {
                id: 'shooting',
                title: 'Primary Weapon',
                description: 'Left-click to fire your primary weapon',
                objective: { type: 'shoot', count: 10 },
                hint: 'Hold down for continuous fire',
                targets: 3
            },
            {
                id: 'brake',
                title: 'Braking',
                description: 'Press SPACE to brake and stop quickly',
                objective: { type: 'brake', count: 3 },
                hint: 'Useful for quick stops and tight maneuvers',
                highlight: ['space']
            },
            {
                id: 'ships',
                title: 'Ship Selection',
                description: 'Press 1, 2, or 3 to change ship types',
                objective: { type: 'changeShip', count: 2 },
                hint: 'Each ship has different stats',
                highlight: ['1', '2', '3']
            },
            {
                id: 'combat',
                title: 'Combat Practice',
                description: 'Destroy 3 practice targets',
                objective: { type: 'destroy', count: 3 },
                hint: 'Aim for the center for maximum damage',
                spawnTargets: true
            },
            {
                id: 'powerups',
                title: 'Power-ups',
                description: 'Collect a power-up to enhance your ship',
                objective: { type: 'collect', count: 1 },
                hint: 'Power-ups provide temporary advantages',
                spawnPowerUp: true
            },
            {
                id: 'complete',
                title: 'Tutorial Complete!',
                description: 'You\'re ready for battle! +1000 XP earned!',
                objective: null,
                duration: 3000,
                reward: 1000
            }
        ];

        // Progress tracking
        this.progress = {
            movement: { distance: 0, startPos: null },
            aiming: { angles: new Set() },
            shooting: { shots: 0 },
            brake: { count: 0, wasBraking: false },
            changeShip: { count: 0, lastShip: null },
            destroy: { count: 0 },
            collect: { count: 0 }
        };

        // Visual elements
        this.tutorialTargets = [];
        this.ghostShip = null;
        this.highlightedKeys = new Set();

        // Check if first time player
        this.checkFirstTime();
    }

    /**
     * Check if this is player's first time
     */
    checkFirstTime() {
        const hasCompletedTutorial = localStorage.getItem('stellarWarfare_tutorialComplete');

        if (!hasCompletedTutorial) {
            // Auto-start for new players
            setTimeout(() => {
                this.showTutorialPrompt();
            }, 1000);
        }
    }

    /**
     * Show tutorial prompt
     */
    showTutorialPrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'tutorial-prompt';
        prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,50,100,0.95));
            border: 3px solid #00ffff;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
            font-family: Orbitron, monospace;
            animation: slideInScale 0.5s ease-out;
            min-width: 400px;
        `;

        prompt.innerHTML = `
            <h2 style="color: #00ffff; margin: 0 0 20px 0; font-size: 28px;">
                First Time Playing?
            </h2>
            <p style="color: white; margin: 20px 0; font-size: 16px;">
                Learn the controls and earn <span style="color: #00ff00; font-weight: bold;">1000 XP</span>
                by completing the tutorial!
            </p>
            <div style="margin-top: 30px;">
                <button id="start-tutorial" style="
                    background: linear-gradient(135deg, #00ffff, #00ff00);
                    border: none;
                    color: black;
                    padding: 15px 30px;
                    font-size: 18px;
                    font-weight: bold;
                    font-family: Orbitron, monospace;
                    cursor: pointer;
                    margin: 0 10px;
                    border-radius: 5px;
                    transition: transform 0.2s;
                ">START TUTORIAL</button>
                <button id="skip-tutorial" style="
                    background: rgba(255,255,255,0.1);
                    border: 1px solid #666;
                    color: #aaa;
                    padding: 15px 30px;
                    font-size: 16px;
                    font-family: Orbitron, monospace;
                    cursor: pointer;
                    margin: 0 10px;
                    border-radius: 5px;
                    transition: all 0.2s;
                ">Skip</button>
            </div>
        `;

        document.body.appendChild(prompt);

        // Add hover effects
        const startBtn = document.getElementById('start-tutorial');
        const skipBtn = document.getElementById('skip-tutorial');

        startBtn.onmouseover = () => startBtn.style.transform = 'scale(1.05)';
        startBtn.onmouseout = () => startBtn.style.transform = 'scale(1)';
        skipBtn.onmouseover = () => {
            skipBtn.style.background = 'rgba(255,255,255,0.2)';
            skipBtn.style.color = 'white';
        };
        skipBtn.onmouseout = () => {
            skipBtn.style.background = 'rgba(255,255,255,0.1)';
            skipBtn.style.color = '#aaa';
        };

        // Button handlers
        startBtn.onclick = () => {
            prompt.remove();
            this.start();
        };

        skipBtn.onclick = () => {
            prompt.style.animation = 'fadeOutScale 0.3s ease-out';
            setTimeout(() => prompt.remove(), 300);
        };
    }

    /**
     * Start tutorial
     */
    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.stepCompleted = false;

        // Create tutorial overlay
        this.createTutorialOverlay();

        // Disable multiplayer during tutorial
        if (this.game.socket) {
            this.game.socket.disconnect();
        }

        // Start first step
        this.startStep(0);
    }

    /**
     * Create tutorial overlay UI
     */
    createTutorialOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 200;
        `;

        // Step indicator
        const stepIndicator = document.createElement('div');
        stepIndicator.id = 'tutorial-step-indicator';
        stepIndicator.style.cssText = `
            position: absolute;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            border: 2px solid #00ffff;
            padding: 20px;
            border-radius: 10px;
            min-width: 400px;
            text-align: center;
            font-family: Orbitron, monospace;
        `;

        // Progress bar
        const progressBar = document.createElement('div');
        progressBar.id = 'tutorial-progress';
        progressBar.style.cssText = `
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            width: 500px;
            height: 8px;
            background: rgba(0,0,0,0.5);
            border: 1px solid #00ffff;
            border-radius: 4px;
            overflow: hidden;
        `;

        const progressFill = document.createElement('div');
        progressFill.id = 'tutorial-progress-fill';
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #00ffff, #00ff00);
            width: 0%;
            transition: width 0.5s ease-out;
        `;
        progressBar.appendChild(progressFill);

        // Skip button
        const skipButton = document.createElement('button');
        skipButton.id = 'tutorial-skip';
        skipButton.textContent = 'Skip Tutorial';
        skipButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.1);
            border: 1px solid #666;
            color: #aaa;
            padding: 10px 20px;
            font-family: Orbitron, monospace;
            cursor: pointer;
            pointer-events: auto;
            border-radius: 5px;
        `;
        skipButton.onclick = () => this.complete();

        overlay.appendChild(stepIndicator);
        overlay.appendChild(progressBar);
        overlay.appendChild(skipButton);
        document.body.appendChild(overlay);
    }

    /**
     * Start a tutorial step
     */
    startStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[stepIndex];
        this.currentStep = stepIndex;
        this.stepCompleted = false;

        // Update progress bar
        const progress = (stepIndex / (this.steps.length - 1)) * 100;
        const progressFill = document.getElementById('tutorial-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        // Update step display
        this.updateStepDisplay(step);

        // Handle step-specific setup
        this.setupStep(step);

        // Auto-advance for non-interactive steps
        if (!step.objective && step.duration) {
            setTimeout(() => {
                this.completeStep();
            }, step.duration);
        }
    }

    /**
     * Update step display
     */
    updateStepDisplay(step) {
        const indicator = document.getElementById('tutorial-step-indicator');
        if (!indicator) return;

        indicator.innerHTML = `
            <h3 style="color: #00ffff; margin: 0 0 10px 0; font-size: 24px;">
                ${step.title}
            </h3>
            <p style="color: white; margin: 10px 0; font-size: 16px;">
                ${step.description}
            </p>
            ${step.hint ? `
                <p style="color: #aaa; margin: 10px 0; font-size: 14px; font-style: italic;">
                    💡 ${step.hint}
                </p>
            ` : ''}
            ${step.objective ? `
                <div id="tutorial-objective" style="
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(0,255,0,0.1);
                    border: 1px solid #00ff00;
                    border-radius: 5px;
                ">
                    <div style="color: #00ff00; font-size: 14px; margin-bottom: 5px;">OBJECTIVE</div>
                    <div id="objective-progress" style="color: white; font-size: 16px;">
                        ${this.getObjectiveText(step.objective)}
                    </div>
                </div>
            ` : ''}
        `;

        // Add pulsing animation for new step
        indicator.style.animation = 'tutorialStepPulse 0.5s ease-out';
        setTimeout(() => {
            indicator.style.animation = '';
        }, 500);
    }

    /**
     * Get objective text
     */
    getObjectiveText(objective) {
        const progressMap = {
            move: () => `Move ${Math.round(this.progress.movement.distance)}/100 units`,
            aim: () => `Aim in ${this.progress.aiming.angles.size}/8 directions`,
            shoot: () => `Fire ${this.progress.shooting.shots}/10 shots`,
            brake: () => `Brake ${this.progress.brake.count}/3 times`,
            changeShip: () => `Change ship ${this.progress.changeShip.count}/2 times`,
            destroy: () => `Destroy ${this.progress.destroy.count}/3 targets`,
            collect: () => `Collect ${this.progress.collect.count}/1 power-up`
        };

        return progressMap[objective.type] ? progressMap[objective.type]() : '';
    }

    /**
     * Setup step-specific elements
     */
    setupStep(step) {
        // Clear previous step elements
        this.clearStepElements();

        // Highlight keys
        if (step.highlight) {
            this.highlightKeys(step.highlight);
        }

        // Spawn targets
        if (step.targets || step.spawnTargets) {
            this.spawnPracticeTargets(step.targets || 3);
        }

        // Spawn power-up
        if (step.spawnPowerUp) {
            this.spawnPowerUp();
        }

        // Show ghost ship for movement
        if (step.id === 'movement') {
            this.showGhostShip();
        }

        // Reset progress for this step
        if (step.objective) {
            this.resetStepProgress(step.objective.type);
        }
    }

    /**
     * Clear step elements
     */
    clearStepElements() {
        // Remove targets
        this.tutorialTargets = [];

        // Remove ghost ship
        this.ghostShip = null;

        // Clear key highlights
        this.highlightedKeys.clear();
        document.querySelectorAll('.key-highlight').forEach(el => el.remove());
    }

    /**
     * Highlight keyboard keys
     */
    highlightKeys(keys) {
        keys.forEach(key => {
            const highlight = document.createElement('div');
            highlight.className = 'key-highlight';
            highlight.style.cssText = `
                position: fixed;
                bottom: 100px;
                padding: 15px 20px;
                background: rgba(0,255,0,0.2);
                border: 2px solid #00ff00;
                color: #00ff00;
                font-family: Orbitron, monospace;
                font-size: 18px;
                font-weight: bold;
                text-transform: uppercase;
                border-radius: 5px;
                animation: keyPulse 1s ease-in-out infinite;
                pointer-events: none;
                z-index: 201;
            `;

            // Position based on key
            const positions = {
                'w': { left: '50%', bottom: '170px', transform: 'translateX(-50%)' },
                's': { left: '50%', bottom: '100px', transform: 'translateX(-50%)' },
                'a': { left: 'calc(50% - 70px)', bottom: '100px' },
                'd': { left: 'calc(50% + 70px)', bottom: '100px' },
                'space': { left: '50%', bottom: '50px', transform: 'translateX(-50%)' },
                '1': { left: 'calc(50% - 70px)', bottom: '200px' },
                '2': { left: '50%', bottom: '200px', transform: 'translateX(-50%)' },
                '3': { left: 'calc(50% + 70px)', bottom: '200px' }
            };

            const pos = positions[key];
            if (pos) {
                Object.assign(highlight.style, pos);
            }

            highlight.textContent = key === 'space' ? 'SPACE' : key.toUpperCase();
            document.body.appendChild(highlight);
            this.highlightedKeys.add(highlight);
        });
    }

    /**
     * Spawn practice targets
     */
    spawnPracticeTargets(count) {
        const centerX = 2000; // World center
        const centerY = 1500;
        const radius = 300;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const target = {
                id: `tutorial-target-${i}`,
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                health: 30,
                maxHealth: 30,
                radius: 30,
                type: 'tutorial-target'
            };
            this.tutorialTargets.push(target);
        }
    }

    /**
     * Spawn power-up
     */
    spawnPowerUp() {
        // Add a power-up near the player
        const player = this.game.getState().player;
        if (player) {
            const powerUp = {
                id: 'tutorial-powerup',
                x: player.x + 200,
                y: player.y,
                type: 'triple-shot',
                color: '#00ff00',
                radius: 20
            };
            this.tutorialTargets.push(powerUp);
        }
    }

    /**
     * Show ghost ship for movement tutorial
     */
    showGhostShip() {
        const player = this.game.getState().player;
        if (player) {
            this.ghostShip = {
                x: player.x + 150,
                y: player.y,
                angle: 0
            };
        }
    }

    /**
     * Reset step progress
     */
    resetStepProgress(type) {
        switch (type) {
            case 'move':
                const player = this.game.getState().player;
                this.progress.movement.startPos = player ? { x: player.x, y: player.y } : null;
                this.progress.movement.distance = 0;
                break;
            case 'aim':
                this.progress.aiming.angles.clear();
                break;
            case 'shoot':
                this.progress.shooting.shots = 0;
                break;
            case 'brake':
                this.progress.brake.count = 0;
                break;
            case 'changeShip':
                this.progress.changeShip.count = 0;
                const currentShip = this.game.getState().player?.shipType;
                this.progress.changeShip.lastShip = currentShip;
                break;
            case 'destroy':
                this.progress.destroy.count = 0;
                break;
            case 'collect':
                this.progress.collect.count = 0;
                break;
        }
    }

    /**
     * Update tutorial (called each frame)
     */
    update(deltaTime) {
        if (!this.isActive || this.stepCompleted) return;

        const step = this.steps[this.currentStep];
        if (!step.objective) return;

        // Track progress based on objective type
        const player = this.game.getState().player;
        if (!player) return;

        let completed = false;

        switch (step.objective.type) {
            case 'move':
                if (this.progress.movement.startPos) {
                    const dx = player.x - this.progress.movement.startPos.x;
                    const dy = player.y - this.progress.movement.startPos.y;
                    this.progress.movement.distance = Math.sqrt(dx * dx + dy * dy);
                    completed = this.progress.movement.distance >= step.objective.distance;
                }
                break;

            case 'aim':
                const angle = Math.floor((player.angle + Math.PI) / (Math.PI / 4));
                this.progress.aiming.angles.add(angle);
                completed = this.progress.aiming.angles.size >= step.objective.angles;
                break;

            case 'shoot':
                // This would be tracked by input events
                completed = this.progress.shooting.shots >= step.objective.count;
                break;

            case 'brake':
                const isBraking = this.game.input.brake;
                if (isBraking && !this.progress.brake.wasBraking) {
                    this.progress.brake.count++;
                }
                this.progress.brake.wasBraking = isBraking;
                completed = this.progress.brake.count >= step.objective.count;
                break;

            case 'changeShip':
                if (player.shipType !== this.progress.changeShip.lastShip) {
                    this.progress.changeShip.count++;
                    this.progress.changeShip.lastShip = player.shipType;
                }
                completed = this.progress.changeShip.count >= step.objective.count;
                break;

            case 'destroy':
                // Check destroyed targets
                completed = this.progress.destroy.count >= step.objective.count;
                break;

            case 'collect':
                // Check collected power-ups
                completed = this.progress.collect.count >= step.objective.count;
                break;
        }

        // Update objective display
        const objectiveProgress = document.getElementById('objective-progress');
        if (objectiveProgress) {
            objectiveProgress.textContent = this.getObjectiveText(step.objective);
        }

        // Complete step if objective met
        if (completed && !this.stepCompleted) {
            this.completeStep();
        }
    }

    /**
     * Complete current step
     */
    completeStep() {
        this.stepCompleted = true;

        // Show completion effect
        this.showStepComplete();

        // Move to next step after delay
        setTimeout(() => {
            this.startStep(this.currentStep + 1);
        }, 1500);
    }

    /**
     * Show step completion effect
     */
    showStepComplete() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,255,0,0.2);
            border: 2px solid #00ff00;
            padding: 20px 40px;
            color: #00ff00;
            font-family: Orbitron, monospace;
            font-size: 24px;
            font-weight: bold;
            border-radius: 10px;
            animation: stepCompleteAnimation 1.5s ease-out forwards;
            pointer-events: none;
            z-index: 202;
        `;
        notification.textContent = '✓ OBJECTIVE COMPLETE';
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 1500);
    }

    /**
     * Complete tutorial
     */
    complete() {
        this.isActive = false;

        // Mark as completed
        localStorage.setItem('stellarWarfare_tutorialComplete', 'true');

        // Remove overlay
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.remove();

        // Clear elements
        this.clearStepElements();

        // Show completion screen
        this.showCompletionScreen();

        // Award XP
        if (window.progressionSystem) {
            window.progressionSystem.addXP(1000, 'Tutorial Complete');
        }

        // Reconnect to multiplayer
        if (this.game.connect) {
            setTimeout(() => {
                this.game.connect('http://localhost:3000');
            }, 3000);
        }
    }

    /**
     * Show completion screen
     */
    showCompletionScreen() {
        const screen = document.createElement('div');
        screen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.5s ease-out;
        `;

        screen.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(0,255,0,0.1), rgba(0,255,255,0.1));
                border: 3px solid #00ff00;
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                font-family: Orbitron, monospace;
                max-width: 500px;
                animation: scaleIn 0.5s ease-out;
            ">
                <h1 style="color: #00ff00; margin: 0 0 20px 0; font-size: 36px;">
                    🎉 TUTORIAL COMPLETE! 🎉
                </h1>
                <p style="color: white; font-size: 18px; margin: 20px 0;">
                    Excellent work, Pilot! You've mastered the basics of Stellar Warfare.
                </p>
                <div style="margin: 30px 0;">
                    <div style="color: #00ffff; font-size: 20px; margin: 10px 0;">
                        Rewards Earned:
                    </div>
                    <div style="color: #00ff00; font-size: 24px; font-weight: bold;">
                        +1000 XP
                    </div>
                </div>
                <p style="color: #aaa; font-size: 14px; margin: 20px 0;">
                    Connecting to multiplayer battle...
                </p>
                <button id="close-completion" style="
                    background: linear-gradient(135deg, #00ffff, #00ff00);
                    border: none;
                    color: black;
                    padding: 15px 30px;
                    font-size: 18px;
                    font-weight: bold;
                    font-family: Orbitron, monospace;
                    cursor: pointer;
                    border-radius: 5px;
                    margin-top: 20px;
                ">ENTER BATTLE</button>
            </div>
        `;

        document.body.appendChild(screen);

        document.getElementById('close-completion').onclick = () => {
            screen.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => screen.remove(), 500);
        };
    }

    /**
     * Render tutorial elements (called by renderer)
     */
    render(ctx, camera) {
        if (!this.isActive) return;

        // Render ghost ship
        if (this.ghostShip) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);

            // Draw ghost ship outline
            const screenX = (this.ghostShip.x - camera.x) * camera.zoom + this.canvas.width / 2;
            const screenY = (this.ghostShip.y - camera.y) * camera.zoom + this.canvas.height / 2;

            ctx.translate(screenX, screenY);
            ctx.rotate(this.ghostShip.angle);

            // Simple triangle ship
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-10, -8);
            ctx.lineTo(-10, 8);
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }

        // Render tutorial targets
        this.tutorialTargets.forEach(target => {
            const screenX = (target.x - camera.x) * camera.zoom + this.canvas.width / 2;
            const screenY = (target.y - camera.y) * camera.zoom + this.canvas.height / 2;

            if (target.type === 'tutorial-target') {
                // Draw target
                ctx.save();
                ctx.strokeStyle = '#ff0000';
                ctx.fillStyle = 'rgba(255,0,0,0.2)';
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.arc(screenX, screenY, target.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Draw crosshair
                ctx.beginPath();
                ctx.moveTo(screenX - target.radius, screenY);
                ctx.lineTo(screenX + target.radius, screenY);
                ctx.moveTo(screenX, screenY - target.radius);
                ctx.lineTo(screenX, screenY + target.radius);
                ctx.stroke();

                // Health bar
                if (target.health < target.maxHealth) {
                    const barWidth = target.radius * 2;
                    const barHeight = 4;
                    const healthPercent = target.health / target.maxHealth;

                    ctx.fillStyle = 'rgba(255,0,0,0.5)';
                    ctx.fillRect(screenX - barWidth / 2, screenY - target.radius - 10, barWidth, barHeight);

                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(screenX - barWidth / 2, screenY - target.radius - 10,
                        barWidth * healthPercent, barHeight);
                }

                ctx.restore();
            } else if (target.type === 'triple-shot') {
                // Draw power-up with pulsing effect
                const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 1;

                ctx.save();
                ctx.fillStyle = target.color;
                ctx.strokeStyle = target.color;
                ctx.globalAlpha = 0.6;

                // Outer glow
                ctx.beginPath();
                ctx.arc(screenX, screenY, target.radius * pulse * 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = 1;
                // Inner core
                ctx.beginPath();
                ctx.arc(screenX, screenY, target.radius, 0, Math.PI * 2);
                ctx.fill();

                // Icon
                ctx.fillStyle = '#000';
                ctx.font = 'bold 20px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚡', screenX, screenY);

                ctx.restore();
            }
        });
    }

    /**
     * Handle shot fired (for tracking)
     */
    onShot() {
        if (this.isActive && this.steps[this.currentStep]?.objective?.type === 'shoot') {
            this.progress.shooting.shots++;
        }
    }

    /**
     * Handle target destroyed
     */
    onTargetDestroyed(targetId) {
        if (this.isActive && this.steps[this.currentStep]?.objective?.type === 'destroy') {
            this.progress.destroy.count++;
            // Remove from tutorial targets
            this.tutorialTargets = this.tutorialTargets.filter(t => t.id !== targetId);
        }
    }

    /**
     * Handle power-up collected
     */
    onPowerUpCollected() {
        if (this.isActive && this.steps[this.currentStep]?.objective?.type === 'collect') {
            this.progress.collect.count++;
        }
    }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent += `
    @keyframes slideInScale {
        from {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
        }
        to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }

    @keyframes fadeOutScale {
        to {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
        }
    }

    @keyframes tutorialStepPulse {
        0% {
            transform: translateX(-50%) scale(0.95);
        }
        50% {
            transform: translateX(-50%) scale(1.02);
        }
        100% {
            transform: translateX(-50%) scale(1);
        }
    }

    @keyframes keyPulse {
        0%, 100% {
            box-shadow: 0 0 10px rgba(0,255,0,0.5);
        }
        50% {
            box-shadow: 0 0 20px rgba(0,255,0,0.8);
        }
    }

    @keyframes stepCompleteAnimation {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }

    @keyframes scaleIn {
        from {
            transform: scale(0.8);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeOut {
        to { opacity: 0; }
    }
`;