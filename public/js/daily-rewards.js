
// Daily Reward System

class DailyRewardSystem {
    constructor() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.createButton();
    }

    createButton() {
        // Add to nav menu
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        // Check if already exists
        if (document.getElementById('daily-reward-btn')) return;

        const li = document.createElement('li');
        const btn = document.createElement('a');
        btn.id = 'daily-reward-btn';
        btn.href = 'javascript:void(0)';
        btn.innerHTML = '🎁 <span class="mobile-hidden">Daily Reward</span>';
        btn.onclick = () => this.claimReward();

        li.appendChild(btn);

        // Insert carefully
        // If logout exists, put before it.
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn && logoutBtn.parentNode && logoutBtn.parentNode.parentNode === navMenu) {
            navMenu.insertBefore(li, logoutBtn.parentNode);
        } else {
            navMenu.appendChild(li);
        }
    }

    async claimReward() {
        // Visual feedback immediately
        const btn = document.getElementById('daily-reward-btn');
        if (btn) btn.style.pointerEvents = 'none';

        try {
            const res = await fetch('/api/game/claim-daily-reward', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                if (window.notifications) {
                    window.notifications.success(`Daily Reward: $${data.reward} (Streak: ${data.streak} days)!`, 5000);
                } else {
                    alert(`Daily Reward: $${data.reward}\nStreak: ${data.streak} days`);
                }
                if (window.soundManager) window.soundManager.play('achievement');

                // Trigger global update
                if (typeof fetchProfile === 'function') fetchProfile();
            } else {
                if (window.notifications) {
                    window.notifications.info(data.error || 'Already claimed today', 3000);
                } else {
                    alert(data.error || 'Already claimed today');
                }
            }
        } catch (err) {
            console.error('Daily reward error', err);
            if (window.notifications) window.notifications.error('Connection error');
        } finally {
            if (btn) btn.style.pointerEvents = 'auto';
        }
    }
}

// Initialize
window.dailyRewardSystem = new DailyRewardSystem();
