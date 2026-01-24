// ========================================
// MONEY GAME - CORE GAME SYSTEMS
// ========================================

// ============ GAME STATE MANAGER ============
class GameState {
    constructor() {
        this.companyId = sessionStorage.getItem("companyId");
        this.data = null;
        this.listeners = [];
    }

    // Subscribe to state changes
    subscribe(callback) {
        this.listeners.push(callback);
    }

    // Notify all listeners
    notify() {
        this.listeners.forEach(callback => callback(this.data));
    }

    // Update game data
    update(newData) {
        this.data = { ...this.data, ...newData };
        this.notify();
    }

    // Load data from server
    async load() {
        if (!this.companyId) {
            window.location.href = "/";
            return;
        }

        try {
            const res = await fetch(`/data/${this.companyId}`);
            this.data = await res.json();
            this.notify();
            return this.data;
        } catch (error) {
            console.error("Failed to load game data:", error);
            return null;
        }
    }
}

// ============ NOTIFICATION SYSTEM ============
class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create notification container
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');

        // Type-based styling
        const styles = {
            success: { bg: '#10b981', icon: '✓' },
            error: { bg: '#ef4444', icon: '✕' },
            warning: { bg: '#f59e0b', icon: '⚠' },
            info: { bg: '#3b82f6', icon: 'ℹ' },
            money: { bg: '#10b981', icon: '💰' },
            level: { bg: '#8b5cf6', icon: '⭐' },
            achievement: { bg: '#f59e0b', icon: '🏆' }
        };

        const style = styles[type] || styles.info;

        notification.style.cssText = `
      background: ${style.bg};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
      transition: transform 0.2s;
    `;

        notification.innerHTML = `
      <span style="font-size: 20px;">${style.icon}</span>
      <span style="flex: 1;">${message}</span>
    `;

        // Hover effect
        notification.onmouseenter = () => {
            notification.style.transform = 'translateX(-5px)';
        };
        notification.onmouseleave = () => {
            notification.style.transform = 'translateX(0)';
        };

        // Click to dismiss
        notification.onclick = () => {
            this.remove(notification);
        };

        this.container.appendChild(notification);

        // Play sound
        if (window.soundManager) {
            window.soundManager.play('notification');
        }

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
    }

    remove(notification) {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Convenience methods
    success(message, duration) { this.show(message, 'success', duration); }
    error(message, duration) { this.show(message, 'error', duration); }
    warning(message, duration) { this.show(message, 'warning', duration); }
    info(message, duration) { this.show(message, 'info', duration); }
    money(message, duration) { this.show(message, 'money', duration); }
    level(message, duration) { this.show(message, 'level', duration); }
    achievement(message, duration) { this.show(message, 'achievement', duration); }
}

// ============ SOUND MANAGER ============
class SoundManager {
    constructor() {
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.volume = parseFloat(localStorage.getItem('soundVolume') || '0.5');
        this.sounds = {};
        this.init();
    }

    init() {
        // Define sound URLs (you'll need to add actual sound files)
        const soundFiles = {
            click: '/sounds/click.mp3',
            money: '/sounds/money.mp3',
            loss: '/sounds/loss.mp3',
            levelup: '/sounds/levelup.mp3',
            notification: '/sounds/notification.mp3',
            achievement: '/sounds/achievement.mp3'
        };

        // Preload sounds
        for (const [name, url] of Object.entries(soundFiles)) {
            const audio = new Audio(url);
            audio.volume = this.volume;
            audio.preload = 'auto';
            this.sounds[name] = audio;

            // Handle loading errors gracefully
            audio.onerror = () => {
                console.warn(`Sound file not found: ${url}`);
            };
        }
    }

    play(soundName) {
        if (!this.enabled) return;

        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.volume = this.volume;
            sound.play().catch(e => console.warn('Sound play failed:', e));
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('soundVolume', this.volume);

        // Update all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }
}

// ============ ANIMATION UTILITIES ============
const Animations = {
    // Fade in element
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';

        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);

            element.style.opacity = opacity;

            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Fade out element
    fadeOut(element, duration = 300) {
        let start = null;
        const initialOpacity = parseFloat(window.getComputedStyle(element).opacity);

        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = initialOpacity * (1 - progress / duration);

            element.style.opacity = Math.max(opacity, 0);

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };

        requestAnimationFrame(animate);
    },

    // Number counter animation
    countUp(element, start, end, duration = 1000) {
        let startTime = null;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function
            const easeOut = 1 - Math.pow(1 - percentage, 3);
            const current = start + (end - start) * easeOut;

            element.textContent = Math.floor(current).toLocaleString();

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end.toLocaleString();
            }
        };

        requestAnimationFrame(animate);
    },

    // Pulse animation
    pulse(element) {
        element.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    },

    // Shake animation (for errors)
    shake(element) {
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
};

// ============ PROGRESS TRACKER ============
class ProgressTracker {
    constructor() {
        this.milestones = [
            { level: 1, balance: 0, title: "Startup" },
            { level: 2, balance: 500, title: "Small Business" },
            { level: 3, balance: 2000, title: "Growing Company" },
            { level: 4, balance: 5000, title: "Established Firm" },
            { level: 5, balance: 10000, title: "Corporation" },
            { level: 10, balance: 50000, title: "Enterprise" },
            { level: 20, balance: 200000, title: "Conglomerate" },
            { level: 50, balance: 1000000, title: "Empire" }
        ];
    }

    getCurrentMilestone(balance) {
        for (let i = this.milestones.length - 1; i >= 0; i--) {
            if (balance >= this.milestones[i].balance) {
                return this.milestones[i];
            }
        }
        return this.milestones[0];
    }

    getNextMilestone(balance) {
        for (let milestone of this.milestones) {
            if (balance < milestone.balance) {
                return milestone;
            }
        }
        return null;
    }

    getProgress(balance) {
        const current = this.getCurrentMilestone(balance);
        const next = this.getNextMilestone(balance);

        if (!next) return 100;

        const range = next.balance - current.balance;
        const progress = balance - current.balance;

        return Math.min(100, (progress / range) * 100);
    }
}

// ============ INITIALIZE GLOBAL SYSTEMS ============
window.gameState = new GameState();
window.notifications = new NotificationSystem();
window.soundManager = new SoundManager();
window.progressTracker = new ProgressTracker();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
`;
document.head.appendChild(style);

console.log('🎮 Game Core Systems Initialized');
