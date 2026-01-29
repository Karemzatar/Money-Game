
/**
 * Anti-Gravity Core Game Engine
 * Frontend Logic
 */

const GameCore = {
    state: {
        balance: 0,
        tempBalance: 0, // For immediate visual feedback before sync
        level: 1,
        companies: [],
        username: 'Pilot'
    },

    config: {
        syncInterval: 5000,
        clickCooldown: 50 // ms
    },

    lastClick: 0,
    syncTimer: null,

    init: async function () {
        console.log('🚀 Anti-Gravity Systems Initializing...');
        this.bindEvents();
        await this.fetchProfile();
        this.startSync();
        this.render();
    },

    bindEvents: function () {
        // Clicker
        const clicker = document.getElementById('main-clicker');
        if (clicker) {
            clicker.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent zoom
                this.handleClick(e.touches[0]);
            }, { passive: false });

            clicker.addEventListener('mousedown', (e) => {
                this.handleClick(e);
            });
        }
    },

    handleClick: function (e) {
        const now = Date.now();
        if (now - this.lastClick < this.config.clickCooldown) return;
        this.lastClick = now;

        // Visual Logic (Immediate)
        let clickValue = this.calculateClickValue();
        this.state.tempBalance += clickValue;
        this.state.balance += clickValue; // Optimistic update

        this.updateHUD();
        this.spawnParticle(e.clientX, e.clientY, `+$${clickValue.toFixed(2)}`);

        // Haptic
        if (navigator.vibrate) navigator.vibrate(5);

        // Server Sync (Debounced or fire-and-forget)
        this.syncClick();

        // Animation
        const clicker = document.getElementById('main-clicker');
        clicker.style.transform = 'scale(0.95) rotate(2deg)';
        setTimeout(() => clicker.style.transform = 'scale(1) rotate(0deg)', 100);
    },

    calculateClickValue: function () {
        // Base logic echoing server logic for prediction
        let base = 1.5 + (this.state.level * 0.5);
        this.state.companies.forEach(c => base += c.income_per_click);
        return base;
    },

    spawnParticle: function (x, y, text) {
        const p = document.createElement('div');
        p.className = 'click-particle';
        p.innerText = text;
        p.style.left = (x - 20) + 'px';
        p.style.top = (y - 40) + 'px';

        // Random drift
        const drift = (Math.random() - 0.5) * 40;
        p.style.transform = `translateX(${drift}px)`;

        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1000);
    },

    syncClick: async function () {
        try {
            // In a real high-traffic game, you'd batch these. 
            // For now, we just call the API.
            const res = await fetch('/api/game/click', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                // Reconcile
                this.state.balance = data.balance;
                this.state.level = data.level;

                if (data.leveledUp) this.showToast(`Level Up! LVL ${data.level}`);
            }
        } catch (e) {
            console.warn("Sync failed", e);
        }
    },

    fetchProfile: async function () {
        try {
            const res = await fetch('/api/game/profile');
            if (res.status === 401) window.location.href = '/index.html';

            const data = await res.json();
            this.state.balance = data.user.balance;
            this.state.level = data.user.level;
            this.state.companies = data.companies || [];
            this.state.username = data.user.username;

            this.render();
        } catch (e) {
            console.error(e);
        }
    },

    startSync: function () {
        if (this.syncTimer) clearInterval(this.syncTimer);
        this.syncTimer = setInterval(() => this.fetchProfile(), this.config.syncInterval);
    },

    buyCompany: async function () {
        const name = prompt("Name your new venture:");
        if (!name) return;

        try {
            const res = await fetch('/api/game/company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast("Company Acquired!");
                this.fetchProfile();
            } else {
                this.showToast(data.error || 'Failed', 'error');
            }
        } catch (e) {
            this.showToast('Network Error', 'error');
        }
    },

    upgradeCompany: async function (id) {
        try {
            const res = await fetch('/api/game/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: id })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast("Upgrade Successful!");
                this.fetchProfile();
            } else {
                this.showToast(data.error || 'Failed', 'error');
            }
        } catch (e) { }
    },

    switchTab: function (tabName) {
        // Reset active state
        document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.game-panel').forEach(el => el.classList.remove('active')); // hide all panels

        // Set active
        // Find tab element roughly by index or logic meant for UI. 
        // For simplicity, we just look at the mapping logic in HTML onclicks
        // Here we just handle the panel visibility

        if (tabName === 'home') {
            // specific logic: close all panels
            document.querySelector('.nav-tab:nth-child(1)').classList.add('active'); // fragile but works for now
        } else if (tabName === 'companies') {
            document.querySelector('#panel-companies').classList.add('active');
            document.querySelector('.nav-tab:nth-child(2)').classList.add('active');
        } else if (tabName === 'profile') {
            document.querySelector('#panel-profile').classList.add('active');
            document.querySelector('.nav-tab:nth-child(3)').classList.add('active');
        }
    },

    render: function () {
        this.updateHUD();
        this.renderCompanies();
        this.renderProfile();
    },

    updateHUD: function () {
        document.getElementById('balance-display').innerText = `$${Math.floor(this.state.balance).toLocaleString()}`;
        document.getElementById('level-display').innerText = `LVL ${this.state.level}`;
        document.getElementById('income-display').innerText = `+${this.calculateClickValue().toFixed(1)}/click`;
    },

    renderCompanies: function () {
        const list = document.getElementById('companies-list');
        if (!list) return;

        list.innerHTML = this.state.companies.map(c => `
            <div class="upgrade-item">
                <div>
                    <div style="font-weight:bold; color:white;">${c.name}</div>
                    <div style="font-size:12px; color:#aaa;">Lvl ${c.level} | +$${c.income_per_click.toFixed(1)}/click</div>
                </div>
                <button class="upgrade-btn" onclick="window.gameCore.upgradeCompany(${c.id})">
                    Upgrade ($${Math.floor(c.upgrade_cost)})
                </button>
            </div>
        `).join('');
    },

    renderProfile: function () {
        const div = document.getElementById('profile-stats');
        if (!div) return;
        div.innerHTML = `
            <p>Username: <strong style="color:white">${this.state.username}</strong></p>
            <p>Total Assets: <strong style="color:white">$${this.state.balance.toFixed(2)}</strong></p>
            <p>Empire Size: <strong style="color:white">${this.state.companies.length} Companies</strong></p>
        `;
    },

    showToast: function (msg, type = 'success') {
        const toast = document.createElement('div');
        toast.style.background = type === 'error' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '20px';
        toast.style.marginTop = '10px';
        toast.style.textAlign = 'center';
        toast.style.fontWeight = 'bold';
        toast.style.backdropFilter = 'blur(4px)';
        toast.style.animation = 'float 0.5s ease-out';
        toast.innerText = msg;

        const area = document.getElementById('toast-area');
        area.appendChild(toast);

        setTimeout(() => toast.remove(), 2000);
    },

    logout: function () {
        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => window.location.href = '/index.html');
    }
};

window.gameCore = GameCore;
