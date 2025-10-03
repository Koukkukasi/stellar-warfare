/**
 * Stellar Warfare UI Components Library
 * Reusable UI components for the game interface
 *
 * Components:
 * - HUD (Heads-Up Display)
 * - Modal dialogs
 * - Notifications
 * - Progress bars and meters
 * - Tooltips
 * - Menus
 * - Input controls
 */

class UIComponent {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;
        this.options = options;
        this.element = null;
        this.id = `ui-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    createElement(tag, className, content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

class HUD extends UIComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.panels = new Map();
        this.init();
    }

    init() {
        this.element = this.createElement('div', 'hud-container');
        this.element.id = this.id;

        // Create default panels
        this.createPanel('top-left', { position: 'top-left' });
        this.createPanel('top-right', { position: 'top-right' });
        this.createPanel('bottom-left', { position: 'bottom-left' });
        this.createPanel('bottom-right', { position: 'bottom-right' });
        this.createPanel('center-top', { position: 'center-top' });

        if (this.container) {
            this.container.appendChild(this.element);
        }
    }

    createPanel(name, options = {}) {
        const panel = this.createElement('div', `hud-panel ${options.className || ''}`);

        // Set position
        const positions = {
            'top-left': { top: '20px', left: '20px' },
            'top-right': { top: '20px', right: '20px' },
            'bottom-left': { bottom: '20px', left: '20px' },
            'bottom-right': { bottom: '20px', right: '20px' },
            'center-top': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
            'center-bottom': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
        };

        if (positions[options.position]) {
            Object.assign(panel.style, {
                position: 'fixed',
                ...positions[options.position]
            });
        }

        this.panels.set(name, panel);
        this.element.appendChild(panel);
        return panel;
    }

    updatePanel(name, content) {
        const panel = this.panels.get(name);
        if (panel) {
            if (typeof content === 'string') {
                panel.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                panel.innerHTML = '';
                panel.appendChild(content);
            } else if (typeof content === 'object') {
                // Update specific values
                for (const [key, value] of Object.entries(content)) {
                    const element = panel.querySelector(`[data-value="${key}"]`);
                    if (element) {
                        element.textContent = value;
                    }
                }
            }
        }
    }

    addToPanel(name, element) {
        const panel = this.panels.get(name);
        if (panel) {
            panel.appendChild(element);
        }
    }

    showPanel(name) {
        const panel = this.panels.get(name);
        if (panel) {
            panel.style.display = 'block';
        }
    }

    hidePanel(name) {
        const panel = this.panels.get(name);
        if (panel) {
            panel.style.display = 'none';
        }
    }
}

class Modal extends UIComponent {
    constructor(options = {}) {
        super(document.body, options);
        this.isOpen = false;
        this.init();
    }

    init() {
        // Create overlay
        this.overlay = this.createElement('div', 'modal-overlay');
        this.overlay.style.display = 'none';

        // Create modal container
        this.modal = this.createElement('div', 'modal');

        // Create header
        this.header = this.createElement('div', 'modal-header');
        this.title = this.createElement('h2', 'modal-title', this.options.title || 'Modal');
        this.header.appendChild(this.title);

        // Create close button
        if (this.options.closable !== false) {
            this.closeBtn = this.createElement('button', 'modal-close', '×');
            this.closeBtn.onclick = () => this.close();
            this.header.appendChild(this.closeBtn);
        }

        // Create body
        this.body = this.createElement('div', 'modal-body');
        if (this.options.content) {
            this.setContent(this.options.content);
        }

        // Create footer
        this.footer = this.createElement('div', 'modal-footer');
        if (this.options.buttons) {
            this.addButtons(this.options.buttons);
        }

        // Assemble modal
        this.modal.appendChild(this.header);
        this.modal.appendChild(this.body);
        this.modal.appendChild(this.footer);
        this.overlay.appendChild(this.modal);

        // Add to DOM
        document.body.appendChild(this.overlay);

        // Close on overlay click
        if (this.options.closeOnOverlay !== false) {
            this.overlay.onclick = (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            };
        }

        // Close on escape key
        this.escHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
    }

    setContent(content) {
        if (typeof content === 'string') {
            this.body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.body.innerHTML = '';
            this.body.appendChild(content);
        }
    }

    addButtons(buttons) {
        this.footer.innerHTML = '';
        buttons.forEach(button => {
            const btn = this.createElement('button', `btn ${button.className || ''}`, button.text);
            btn.onclick = () => {
                if (button.onClick) button.onClick(this);
                if (button.close !== false) this.close();
            };
            this.footer.appendChild(btn);
        });
    }

    open() {
        this.isOpen = true;
        this.overlay.style.display = 'flex';
        document.addEventListener('keydown', this.escHandler);

        // Trigger animation
        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
            this.modal.classList.add('active');
        });

        if (this.options.onOpen) {
            this.options.onOpen(this);
        }
    }

    close() {
        this.isOpen = false;
        this.overlay.classList.remove('active');
        this.modal.classList.remove('active');

        setTimeout(() => {
            this.overlay.style.display = 'none';
        }, 300);

        document.removeEventListener('keydown', this.escHandler);

        if (this.options.onClose) {
            this.options.onClose(this);
        }
    }

    destroy() {
        this.close();
        super.destroy();
    }
}

class Notification extends UIComponent {
    constructor(options = {}) {
        super(document.body, options);
        this.init();
    }

    init() {
        // Create notification element
        this.element = this.createElement('div', `notification ${this.options.type || 'info'}`);

        // Add title
        if (this.options.title) {
            this.title = this.createElement('div', 'notification-title', this.options.title);
            this.element.appendChild(this.title);
        }

        // Add message
        this.message = this.createElement('div', 'notification-message', this.options.message || '');
        this.element.appendChild(this.message);

        // Add close button
        if (this.options.closable !== false) {
            this.closeBtn = this.createElement('button', 'notification-close', '×');
            this.closeBtn.onclick = () => this.close();
            this.element.appendChild(this.closeBtn);
        }

        // Position notification
        this.element.style.position = 'fixed';
        this.element.style.zIndex = '9999';

        // Calculate position
        const existing = document.querySelectorAll('.notification');
        const offset = existing.length * 80;

        switch(this.options.position) {
            case 'bottom-right':
                this.element.style.bottom = `${20 + offset}px`;
                this.element.style.right = '20px';
                break;
            case 'bottom-left':
                this.element.style.bottom = `${20 + offset}px`;
                this.element.style.left = '20px';
                break;
            case 'top-left':
                this.element.style.top = `${20 + offset}px`;
                this.element.style.left = '20px';
                break;
            default: // top-right
                this.element.style.top = `${20 + offset}px`;
                this.element.style.right = '20px';
        }

        // Add to DOM
        document.body.appendChild(this.element);

        // Auto close
        if (this.options.duration !== Infinity) {
            this.timeout = setTimeout(() => {
                this.close();
            }, this.options.duration || 5000);
        }
    }

    close() {
        clearTimeout(this.timeout);
        this.element.classList.add('closing');

        setTimeout(() => {
            this.destroy();
        }, 300);

        if (this.options.onClose) {
            this.options.onClose(this);
        }
    }

    static success(message, options = {}) {
        return new Notification({
            ...options,
            message,
            type: 'success',
            title: options.title || 'Success'
        });
    }

    static error(message, options = {}) {
        return new Notification({
            ...options,
            message,
            type: 'error',
            title: options.title || 'Error'
        });
    }

    static warning(message, options = {}) {
        return new Notification({
            ...options,
            message,
            type: 'warning',
            title: options.title || 'Warning'
        });
    }

    static info(message, options = {}) {
        return new Notification({
            ...options,
            message,
            type: 'info',
            title: options.title || 'Info'
        });
    }
}

class ProgressBar extends UIComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.value = options.value || 0;
        this.max = options.max || 100;
        this.init();
    }

    init() {
        // Create container
        this.element = this.createElement('div', `progress-bar ${this.options.className || ''}`);

        // Create fill
        this.fill = this.createElement('div', 'progress-bar-fill');
        this.element.appendChild(this.fill);

        // Create label if needed
        if (this.options.showLabel) {
            this.label = this.createElement('div', 'progress-bar-label');
            this.element.appendChild(this.label);
            this.updateLabel();
        }

        // Add to container
        if (this.container) {
            this.container.appendChild(this.element);
        }

        // Set initial value
        this.setValue(this.value);
    }

    setValue(value, animate = true) {
        this.value = Math.max(0, Math.min(value, this.max));
        const percentage = (this.value / this.max) * 100;

        if (animate) {
            this.fill.style.transition = 'width 0.3s ease-out';
        } else {
            this.fill.style.transition = 'none';
        }

        this.fill.style.width = `${percentage}%`;

        // Update color based on value
        if (this.options.colorSteps) {
            for (const [threshold, className] of Object.entries(this.options.colorSteps)) {
                if (percentage <= parseFloat(threshold)) {
                    this.element.className = `progress-bar ${className}`;
                    break;
                }
            }
        }

        if (this.label) {
            this.updateLabel();
        }

        if (this.options.onChange) {
            this.options.onChange(this.value, percentage);
        }
    }

    updateLabel() {
        if (this.label) {
            if (this.options.labelFormat) {
                this.label.textContent = this.options.labelFormat(this.value, this.max);
            } else {
                this.label.textContent = `${Math.round((this.value / this.max) * 100)}%`;
            }
        }
    }

    increase(amount) {
        this.setValue(this.value + amount);
    }

    decrease(amount) {
        this.setValue(this.value - amount);
    }
}

class Meter extends UIComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.value = options.value || 0;
        this.max = options.max || 100;
        this.radius = options.radius || 28;
        this.init();
    }

    init() {
        // Create container
        this.element = this.createElement('div', `meter ${this.options.className || ''}`);

        // Create SVG
        const size = (this.radius + 4) * 2;
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'meter-circle');
        this.svg.setAttribute('width', size);
        this.svg.setAttribute('height', size);
        this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

        // Create background circle
        this.bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.bgCircle.setAttribute('class', 'meter-circle-bg');
        this.bgCircle.setAttribute('cx', size / 2);
        this.bgCircle.setAttribute('cy', size / 2);
        this.bgCircle.setAttribute('r', this.radius);

        // Create fill circle
        this.fillCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.fillCircle.setAttribute('class', 'meter-circle-fill');
        this.fillCircle.setAttribute('cx', size / 2);
        this.fillCircle.setAttribute('cy', size / 2);
        this.fillCircle.setAttribute('r', this.radius);

        // Calculate circumference
        this.circumference = 2 * Math.PI * this.radius;
        this.fillCircle.style.strokeDasharray = this.circumference;
        this.fillCircle.style.strokeDashoffset = this.circumference;

        // Assemble SVG
        this.svg.appendChild(this.bgCircle);
        this.svg.appendChild(this.fillCircle);
        this.element.appendChild(this.svg);

        // Create value label
        if (this.options.showValue !== false) {
            this.valueLabel = this.createElement('div', 'meter-value');
            this.element.appendChild(this.valueLabel);
            this.updateValue();
        }

        // Add to container
        if (this.container) {
            this.container.appendChild(this.element);
        }

        // Set initial value
        this.setValue(this.value);
    }

    setValue(value, animate = true) {
        this.value = Math.max(0, Math.min(value, this.max));
        const percentage = (this.value / this.max) * 100;
        const offset = this.circumference - (percentage / 100) * this.circumference;

        if (animate) {
            this.fillCircle.style.transition = 'stroke-dashoffset 0.3s ease-out';
        } else {
            this.fillCircle.style.transition = 'none';
        }

        this.fillCircle.style.strokeDashoffset = offset;

        // Update color based on value
        if (this.options.colorSteps) {
            for (const [threshold, color] of Object.entries(this.options.colorSteps)) {
                if (percentage <= parseFloat(threshold)) {
                    this.fillCircle.style.stroke = color;
                    if (this.valueLabel) this.valueLabel.style.color = color;
                    break;
                }
            }
        }

        if (this.valueLabel) {
            this.updateValue();
        }

        if (this.options.onChange) {
            this.options.onChange(this.value, percentage);
        }
    }

    updateValue() {
        if (this.valueLabel) {
            if (this.options.valueFormat) {
                this.valueLabel.textContent = this.options.valueFormat(this.value, this.max);
            } else {
                this.valueLabel.textContent = `${Math.round(this.value)}`;
            }
        }
    }
}

class Tooltip extends UIComponent {
    constructor(target, options = {}) {
        super(document.body, options);
        this.target = typeof target === 'string'
            ? document.querySelector(target)
            : target;
        this.init();
    }

    init() {
        if (!this.target) return;

        // Create tooltip element
        this.element = this.createElement('div', 'tooltip');
        this.element.textContent = this.options.content || '';
        this.element.style.display = 'none';
        document.body.appendChild(this.element);

        // Add event listeners
        this.target.addEventListener('mouseenter', (e) => this.show(e));
        this.target.addEventListener('mouseleave', () => this.hide());
        this.target.addEventListener('mousemove', (e) => this.updatePosition(e));
    }

    show(e) {
        this.element.style.display = 'block';
        this.updatePosition(e);

        // Trigger animation
        requestAnimationFrame(() => {
            this.element.classList.add('visible');
        });
    }

    hide() {
        this.element.classList.remove('visible');
        setTimeout(() => {
            this.element.style.display = 'none';
        }, 150);
    }

    updatePosition(e) {
        const offset = 10;
        let x = e.clientX + offset;
        let y = e.clientY + offset;

        // Check if tooltip goes off screen
        const rect = this.element.getBoundingClientRect();

        if (x + rect.width > window.innerWidth) {
            x = e.clientX - rect.width - offset;
        }

        if (y + rect.height > window.innerHeight) {
            y = e.clientY - rect.height - offset;
        }

        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    setContent(content) {
        this.element.textContent = content;
    }
}

class Menu extends UIComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.items = options.items || [];
        this.init();
    }

    init() {
        // Create menu container
        this.element = this.createElement('div', `menu ${this.options.className || ''}`);

        // Create menu items
        this.items.forEach(item => {
            if (item.separator) {
                const separator = this.createElement('div', 'menu-separator');
                this.element.appendChild(separator);
            } else {
                const menuItem = this.createMenuItem(item);
                this.element.appendChild(menuItem);
            }
        });

        // Add to container
        if (this.container) {
            this.container.appendChild(this.element);
        }
    }

    createMenuItem(item) {
        const element = this.createElement('div', `menu-item ${item.className || ''}`);

        // Add icon
        if (item.icon) {
            const icon = this.createElement('span', 'menu-item-icon', item.icon);
            element.appendChild(icon);
        }

        // Add label
        const label = this.createElement('span', 'menu-item-label', item.label);
        element.appendChild(label);

        // Add shortcut
        if (item.shortcut) {
            const shortcut = this.createElement('span', 'menu-item-shortcut', item.shortcut);
            element.appendChild(shortcut);
        }

        // Add submenu indicator
        if (item.submenu) {
            const arrow = this.createElement('span', 'menu-item-arrow', '▶');
            element.appendChild(arrow);

            // Create submenu
            const submenu = new Menu(null, {
                items: item.submenu,
                className: 'submenu'
            });
            element.appendChild(submenu.element);
        }

        // Add click handler
        if (item.onClick) {
            element.onclick = (e) => {
                e.stopPropagation();
                item.onClick(item);
                if (this.options.closeOnSelect) {
                    this.close();
                }
            };
        }

        // Handle disabled state
        if (item.disabled) {
            element.classList.add('disabled');
            element.onclick = null;
        }

        return element;
    }

    addItem(item) {
        const menuItem = this.createMenuItem(item);
        this.element.appendChild(menuItem);
        this.items.push(item);
    }

    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            this.element.children[index].remove();
        }
    }

    close() {
        this.element.style.display = 'none';
        if (this.options.onClose) {
            this.options.onClose();
        }
    }

    open() {
        this.element.style.display = 'block';
        if (this.options.onOpen) {
            this.options.onOpen();
        }
    }
}

class LoadingScreen extends UIComponent {
    constructor(options = {}) {
        super(document.body, options);
        this.init();
    }

    init() {
        // Create overlay
        this.element = this.createElement('div', 'loading-overlay');

        // Create container
        const container = this.createElement('div', 'loading-container');

        // Create spinner or custom loader
        if (this.options.type === 'dots') {
            const dots = this.createElement('div', 'loading-dots');
            for (let i = 0; i < 3; i++) {
                dots.appendChild(this.createElement('div', 'loading-dot'));
            }
            container.appendChild(dots);
        } else {
            const spinner = this.createElement('div', 'loading-spinner');
            container.appendChild(spinner);
        }

        // Add message
        if (this.options.message) {
            const message = this.createElement('div', 'loading-message', this.options.message);
            container.appendChild(message);
        }

        // Add progress bar if needed
        if (this.options.showProgress) {
            this.progressBar = new ProgressBar(null, {
                className: 'loading-progress',
                max: 100,
                showLabel: true
            });
            container.appendChild(this.progressBar.element);
        }

        this.element.appendChild(container);
        document.body.appendChild(this.element);
    }

    show() {
        this.element.style.display = 'flex';
        requestAnimationFrame(() => {
            this.element.classList.add('visible');
        });
    }

    hide() {
        this.element.classList.remove('visible');
        setTimeout(() => {
            this.element.style.display = 'none';
        }, 300);
    }

    setProgress(value) {
        if (this.progressBar) {
            this.progressBar.setValue(value);
        }
    }

    setMessage(message) {
        const messageElement = this.element.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
}

// Factory function for quick component creation
const UI = {
    createHUD: (container, options) => new HUD(container, options),
    createModal: (options) => new Modal(options),
    createNotification: (options) => new Notification(options),
    createProgressBar: (container, options) => new ProgressBar(container, options),
    createMeter: (container, options) => new Meter(container, options),
    createTooltip: (target, options) => new Tooltip(target, options),
    createMenu: (container, options) => new Menu(container, options),
    createLoadingScreen: (options) => new LoadingScreen(options),

    // Quick notifications
    notify: {
        success: (message, options) => Notification.success(message, options),
        error: (message, options) => Notification.error(message, options),
        warning: (message, options) => Notification.warning(message, options),
        info: (message, options) => Notification.info(message, options)
    },

    // Confirmation dialog
    confirm: (message, options = {}) => {
        return new Promise((resolve) => {
            const modal = new Modal({
                title: options.title || 'Confirm',
                content: message,
                closable: options.closable !== false,
                buttons: [
                    {
                        text: options.confirmText || 'Confirm',
                        className: 'btn-primary',
                        onClick: () => resolve(true)
                    },
                    {
                        text: options.cancelText || 'Cancel',
                        className: 'btn-secondary',
                        onClick: () => resolve(false)
                    }
                ]
            });
            modal.open();
        });
    },

    // Alert dialog
    alert: (message, options = {}) => {
        const modal = new Modal({
            title: options.title || 'Alert',
            content: message,
            closable: true,
            buttons: [
                {
                    text: options.buttonText || 'OK',
                    className: 'btn-primary'
                }
            ]
        });
        modal.open();
        return modal;
    }
};

// Export for use in other modules
export {
    UIComponent,
    HUD,
    Modal,
    Notification,
    ProgressBar,
    Meter,
    Tooltip,
    Menu,
    LoadingScreen,
    UI
};