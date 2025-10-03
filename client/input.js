export class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;

        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseWorldX = 0;
        this.mouseWorldY = 0;

        // Key mappings
        this.keyMap = {
            'KeyW': 'forward',
            'KeyS': 'backward',
            'KeyA': 'left',
            'KeyD': 'right',
            'Space': 'brake',
            'Digit1': 'ship1',
            'Digit2': 'ship2',
            'Digit3': 'ship3'
        };

        // Active keys
        this.activeKeys = new Set();

        this.initEventListeners();
    }

    initEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Prevent default behavior for game keys
        window.addEventListener('keydown', (e) => {
            if (this.keyMap[e.code]) {
                e.preventDefault();
            }
        });
    }

    handleKeyDown(e) {
        const action = this.keyMap[e.code];
        if (!action) return;

        // Prevent key repeat
        if (this.activeKeys.has(e.code)) return;
        this.activeKeys.add(e.code);

        switch (action) {
            case 'forward':
                this.game.setInput('forward', true);
                break;
            case 'backward':
                this.game.setInput('backward', true);
                break;
            case 'left':
                this.game.setInput('left', true);
                break;
            case 'right':
                this.game.setInput('right', true);
                break;
            case 'brake':
                this.game.setInput('brake', true);
                break;
            case 'ship1':
                this.game.setShipType('Interceptor');
                break;
            case 'ship2':
                this.game.setShipType('Gunship');
                break;
            case 'ship3':
                this.game.setShipType('Cruiser');
                break;
        }
    }

    handleKeyUp(e) {
        const action = this.keyMap[e.code];
        if (!action) return;

        this.activeKeys.delete(e.code);

        switch (action) {
            case 'forward':
                this.game.setInput('forward', false);
                break;
            case 'backward':
                this.game.setInput('backward', false);
                break;
            case 'left':
                this.game.setInput('left', false);
                break;
            case 'right':
                this.game.setInput('right', false);
                break;
            case 'brake':
                this.game.setInput('brake', false);
                break;
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;

        // Calculate world coordinates
        const player = this.game.getState().player;
        if (player) {
            // Convert screen to world coordinates
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            this.mouseWorldX = player.x + (this.mouseX - centerX);
            this.mouseWorldY = player.y + (this.mouseY - centerY);

            // Calculate angle to mouse
            const dx = this.mouseWorldX - player.x;
            const dy = this.mouseWorldY - player.y;
            player.angle = Math.atan2(dy, dx);

            // Update game input
            this.game.setInput('mouseX', this.mouseWorldX);
            this.game.setInput('mouseY', this.mouseWorldY);
        }
    }

    handleMouseDown(e) {
        if (e.button === 0) { // Left click
            this.game.setInput('fire', true);
        } else if (e.button === 2) { // Right click
            this.game.setInput('secondaryFire', true);
        }
    }

    handleMouseUp(e) {
        if (e.button === 0) { // Left click
            this.game.setInput('fire', false);
        } else if (e.button === 2) { // Right click
            this.game.setInput('secondaryFire', false);
        }
    }

    // Helper method to check if a key is currently pressed
    isKeyPressed(code) {
        return this.activeKeys.has(code);
    }

    // Get current mouse position in world coordinates
    getMouseWorldPosition() {
        return {
            x: this.mouseWorldX,
            y: this.mouseWorldY
        };
    }

    // Clean up event listeners
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    }
}
