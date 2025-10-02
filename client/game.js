export class Game {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.playerId = null;

        // Game state
        this.state = {
            player: {
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                angle: 0,
                shipType: 'Interceptor',
                health: 100,
                energy: 100
            },
            entities: [],
            projectiles: [],
            particles: []
        };

        // Input state
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            brake: false,
            fire: false,
            mouseX: 0,
            mouseY: 0,
            shipType: 'Interceptor'
        };

        // Network update rate
        this.networkUpdateRate = 1000 / 20; // 20 updates per second
        this.lastNetworkUpdate = 0;
    }

    connect(url) {
        console.log('Connecting to server:', url);

        this.socket = io(url);

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            this.socket.emit('joinQueue', { shipType: this.input.shipType });
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        this.socket.on('gameJoined', (data) => {
            this.playerId = data.playerId;
            console.log('Received player ID:', this.playerId);
        });

        this.socket.on('gameState', (state) => {
            this.updateGameState(state);
        });

        this.socket.on('playerJoined', (data) => {
            console.log('Player joined:', data.playerId);
        });

        this.socket.on('playerLeft', (data) => {
            console.log('Player left:', data.playerId);
        });
    }

    updateGameState(serverState) {
        // Combine all entities into one array for rendering
        this.state.entities = [];

        // Add all players (except self)
        if (serverState.players) {
            serverState.players.forEach(player => {
                if (player.id !== this.playerId && !player.isDead) {
                    this.state.entities.push({
                        ...player,
                        type: 'ship',
                        angle: player.rotation || 0
                    });
                }
            });
        }

        // Add all bots
        if (serverState.bots) {
            serverState.bots.forEach(bot => {
                if (!bot.isDead) {
                    this.state.entities.push({
                        ...bot,
                        type: 'ship',
                        angle: bot.rotation || 0
                    });
                }
            });
        }

        // Add asteroids
        if (serverState.asteroids) {
            serverState.asteroids.forEach(asteroid => {
                this.state.entities.push({
                    ...asteroid,
                    type: 'asteroid'
                });
            });
        }

        // Update projectiles
        this.state.projectiles = serverState.projectiles || [];

        // Update player state
        if (this.playerId && serverState.players) {
            const serverPlayer = serverState.players.find(p => p.id === this.playerId);
            if (serverPlayer) {
                this.state.player = {
                    ...serverPlayer,
                    angle: serverPlayer.rotation || 0,
                    id: this.playerId
                };
            }
        }
    }

    update(deltaTime) {
        // Send input to server
        const currentTime = performance.now();
        if (currentTime - this.lastNetworkUpdate >= this.networkUpdateRate) {
            this.sendInput();
            this.lastNetworkUpdate = currentTime;
        }

        // Client-side prediction (optional)
        this.predictPlayerMovement(deltaTime);
    }

    predictPlayerMovement(deltaTime) {
        // Simple client-side prediction to reduce perceived latency
        const player = this.state.player;
        if (!player) return;

        const shipConfig = this.getShipConfig(player.shipType);

        // Calculate acceleration based on input
        let ax = 0;
        let ay = 0;

        if (this.input.forward) {
            ax += Math.cos(player.angle) * shipConfig.acceleration;
            ay += Math.sin(player.angle) * shipConfig.acceleration;
        }
        if (this.input.backward) {
            ax -= Math.cos(player.angle) * shipConfig.acceleration * 0.5;
            ay -= Math.sin(player.angle) * shipConfig.acceleration * 0.5;
        }
        if (this.input.left) {
            ax -= Math.cos(player.angle + Math.PI / 2) * shipConfig.acceleration * 0.7;
            ay -= Math.sin(player.angle + Math.PI / 2) * shipConfig.acceleration * 0.7;
        }
        if (this.input.right) {
            ax += Math.cos(player.angle + Math.PI / 2) * shipConfig.acceleration * 0.7;
            ay += Math.sin(player.angle + Math.PI / 2) * shipConfig.acceleration * 0.7;
        }

        // Apply braking
        if (this.input.brake) {
            player.vx *= 0.9;
            player.vy *= 0.9;
        }

        // Update velocity
        player.vx += ax * deltaTime;
        player.vy += ay * deltaTime;

        // Apply drag
        player.vx *= (1 - shipConfig.drag * deltaTime);
        player.vy *= (1 - shipConfig.drag * deltaTime);

        // Limit speed
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (speed > shipConfig.maxSpeed) {
            player.vx = (player.vx / speed) * shipConfig.maxSpeed;
            player.vy = (player.vy / speed) * shipConfig.maxSpeed;
        }

        // Update position
        player.x += player.vx * deltaTime;
        player.y += player.vy * deltaTime;
    }

    getShipConfig(shipType) {
        const configs = {
            Interceptor: {
                acceleration: 300,
                maxSpeed: 400,
                drag: 0.5,
                turnRate: 5
            },
            Gunship: {
                acceleration: 200,
                maxSpeed: 300,
                drag: 0.6,
                turnRate: 3
            },
            Cruiser: {
                acceleration: 150,
                maxSpeed: 250,
                drag: 0.7,
                turnRate: 2
            }
        };
        return configs[shipType] || configs.Interceptor;
    }

    sendInput() {
        if (!this.connected || !this.socket) return;

        this.socket.emit('playerInput', {
            forward: this.input.forward,
            backward: this.input.backward,
            left: this.input.left,
            right: this.input.right,
            brake: this.input.brake,
            fire: this.input.fire,
            mouseX: this.input.mouseX,
            mouseY: this.input.mouseY,
            angle: this.state.player.angle
        });
    }

    setInput(key, value) {
        this.input[key] = value;
    }

    setShipType(shipType) {
        this.input.shipType = shipType;
        if (this.connected && this.socket) {
            this.socket.emit('changeShip', { shipType: shipType });
        }
    }

    getState() {
        return this.state;
    }

    isConnected() {
        return this.connected;
    }
}
