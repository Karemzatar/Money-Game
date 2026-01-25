let userData = null;
let adTimer = null;

async function fetchProfile() {
    try {
        const res = await fetch('/api/game/profile');
        if (res.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        userData = await res.json();
        updateUI();
    } catch (err) {
        console.error('Failed to fetch profile', err);
    }
}

function updateUI() {
    if (!userData) return;

    document.getElementById('balanceText').innerText = `$${userData.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('levelText').innerText = userData.level;
    document.getElementById('usernameText').innerText = userData.username || 'Manager';

    // Level progress
    // Formula: Level = floor(sqrt(total_earned / 100)) + 1
    // So current level's threshold is (level-1)^2 * 100
    // Next level's threshold is (level)^2 * 100
    const currentThreshold = Math.pow(userData.level - 1, 2) * 100;
    const nextThreshold = Math.pow(userData.level, 2) * 100;
    const progress = ((userData.total_earned - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    document.getElementById('levelProgress').style.width = `${Math.min(100, Math.max(0, progress))}%`;

    // Multiplier
    const isMultiplierActive = userData.multiplier_until > Date.now();
    const multText = document.getElementById('multiplierText');
    const multTimerText = document.getElementById('multiplierTimer');

    if (isMultiplierActive) {
        multText.innerText = `x${userData.multiplier_value}`;
        multText.style.color = 'var(--accent-green)';
        multTimerText.style.display = 'block';
        const remaining = Math.ceil((userData.multiplier_until - Date.now()) / 1000);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        multTimerText.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
        multText.innerText = 'x1';
        multText.style.color = 'var(--text-primary)';
        multTimerText.style.display = 'none';
    }

    // Companies list
    const list = document.getElementById('companiesList');
    list.innerHTML = '';
    userData.companies.forEach(company => {
        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.margin = '0';
        card.innerHTML = `
            <h3>${company.name}</h3>
            <p>Level: ${company.level}</p>
            <p>Income: $${company.income_per_click.toFixed(2)} / click</p>
            <button class="btn btn-secondary" onclick="upgradeCompany(${company.id})" ${userData.balance < company.upgrade_cost ? 'disabled' : ''}>
                Upgrade ($${company.upgrade_cost.toLocaleString()})
            </button>
        `;
        list.appendChild(card);
    });
}

async function clickMoney() {
    try {
        const res = await fetch('/api/game/click', { method: 'POST' });
        const data = await res.json();

        // Local update for snappiness
        userData.balance = data.balance;
        userData.level = data.level;
        userData.total_earned = data.totalEarned;
        updateUI();

        if (data.leveledUp) {
            alert('LEVEL UP! You are now level ' + data.level);
        }

        // Visual feedback
        const clicker = document.getElementById('mainClicker');
        clicker.style.transform = 'scale(0.95)';
        setTimeout(() => clicker.style.transform = 'translateY(-8px) scale(1.02)', 100);
    } catch (err) {
        console.error('Click failed', err);
    }
}

async function upgradeCompany(id) {
    try {
        const res = await fetch('/api/game/upgrade-company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId: id })
        });
        const data = await res.json();
        if (data.success) {
            fetchProfile(); // Refresh everything
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Upgrade failed', err);
    }
}

async function buyCompany() {
    const name = prompt('Enter your new company name:');
    if (!name) return;

    try {
        const res = await fetch('/api/game/buy-company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) {
            fetchProfile();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Purchase failed', err);
    }
}

async function startAd() {
    const btn = document.getElementById('watchAdBtn');
    const adArea = document.getElementById('adProgressArea');
    const progressBar = document.getElementById('adProgressBar');
    const timerText = document.getElementById('adTimerText');

    try {
        const res = await fetch('/api/game/ad-start', { method: 'POST' });
        if (!res.ok) return alert('Cannot start ad right now');

        btn.style.display = 'none';
        adArea.style.display = 'block';

        let seconds = 30;
        const interval = setInterval(() => {
            seconds--;
            const progress = ((30 - seconds) / 30) * 100;
            progressBar.style.width = progress + '%';
            timerText.innerText = `Wait ${seconds}s...`;

            if (seconds <= 0) {
                clearInterval(interval);
                completeAd();
            }
        }, 1000);
    } catch (err) {
        console.error('Ad start failed', err);
    }
}

async function completeAd() {
    try {
        const res = await fetch('/api/game/ad-complete', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            alert('Reward activated! x5 Multiplier for 2 minutes.');
            fetchProfile();
        } else {
            alert('Ad reward failed: ' + data.error);
        }

        document.getElementById('watchAdBtn').style.display = 'block';
        document.getElementById('adProgressArea').style.display = 'none';
    } catch (err) {
        console.error('Ad completion failed', err);
    }
}

// Event Listeners
document.getElementById('mainClicker').addEventListener('click', clickMoney);
document.getElementById('buyCompanyBtn').addEventListener('click', buyCompany);
document.getElementById('watchAdBtn').addEventListener('click', startAd);

// Init
fetchProfile();
setInterval(fetchProfile, 10000); // Sync every 10s
setInterval(updateUI, 1000); // Smooth timer updates
