// ========== REWARDED AD SYSTEM ==========
// Configuration
const AD_CONFIG = {
    COOLDOWN_MINUTES: 10,
    TIMER_SECONDS: 30,
    AD_LINK: "https://cuty.io/vYKBJTB"
};

// Level-based reward system
const REWARD_TIERS = {
    1: { minBalance: 0, reward: 50 },
    2: { minBalance: 500, reward: 75 },
    3: { minBalance: 2000, reward: 100 },
    4: { minBalance: 5000, reward: 150 },
    5: { minBalance: 10000, reward: 250 }
};

// State
let adTimer = null;
let remainingTime = AD_CONFIG.TIMER_SECONDS;

// Calculate user level based on balance
function calculateAdLevel(balance) {
    if (balance >= 10000) return 5;
    if (balance >= 5000) return 4;
    if (balance >= 2000) return 3;
    if (balance >= 500) return 2;
    return 1;
}

// Get reward amount for level
function getAdReward(level) {
    return REWARD_TIERS[level]?.reward || 50;
}

// Get current balance from UI
function getCurrentBalance() {
    const balanceText = document.getElementById('balance')?.innerText || '$0';
    return parseFloat(balanceText.replace(/[$,]/g, '')) || 0;
}

// Update reward display
function updateRewardDisplay() {
    const balance = getCurrentBalance();
    const level = calculateAdLevel(balance);
    const reward = getAdReward(level);

    const rewardElement = document.getElementById('rewardAmount');
    if (rewardElement) {
        rewardElement.innerText = reward;
    }
}

// Check if user can watch ad (cooldown check)
function canWatchAd() {
    const lastAdTime = localStorage.getItem("lastAdTime");
    if (!lastAdTime) return true;

    const elapsedMinutes = (Date.now() - Number(lastAdTime)) / 60000;
    return elapsedMinutes >= AD_CONFIG.COOLDOWN_MINUTES;
}

// Update cooldown display
function updateCooldownDisplay() {
    const lastAdTime = localStorage.getItem("lastAdTime");
    const cooldownElement = document.getElementById('adCooldown');
    const cooldownTimeElement = document.getElementById('cooldownTime');

    if (!lastAdTime || !cooldownElement) {
        if (cooldownElement) cooldownElement.style.display = 'none';
        return;
    }

    const elapsedMinutes = (Date.now() - Number(lastAdTime)) / 60000;
    const remainingMinutes = AD_CONFIG.COOLDOWN_MINUTES - elapsedMinutes;

    if (remainingMinutes > 0) {
        cooldownElement.style.display = 'block';
        const mins = Math.floor(remainingMinutes);
        const secs = Math.floor((remainingMinutes - mins) * 60);
        cooldownTimeElement.innerText = `${mins}m ${secs}s`;
    } else {
        cooldownElement.style.display = 'none';
    }
}

// Start ad watching process
function startRewardAd() {
    // Check cooldown
    if (!canWatchAd()) {
        alert(`⏳ Please wait before watching another ad.\n\nYou can watch one ad every ${AD_CONFIG.COOLDOWN_MINUTES} minutes.`);
        return;
    }

    // Open ad link
    window.open(AD_CONFIG.AD_LINK, "_blank");

    // Get UI elements
    const timerElement = document.getElementById("adTimer");
    const timerSecondsElement = document.getElementById("timerSeconds");
    const adButton = document.querySelector("#rewardAd button");

    // Show timer and disable button
    if (timerElement) timerElement.style.display = "block";
    if (adButton) {
        adButton.disabled = true;
        adButton.style.opacity = "0.5";
        adButton.style.cursor = "not-allowed";
    }

    // Start countdown
    remainingTime = AD_CONFIG.TIMER_SECONDS;
    adTimer = setInterval(() => {
        remainingTime--;
        if (timerSecondsElement) {
            timerSecondsElement.innerText = remainingTime;
        }

        if (remainingTime <= 0) {
            clearInterval(adTimer);
            completeAd();
        }
    }, 1000);
}

// Complete ad and claim reward
async function completeAd() {
    // Reset UI
    const timerElement = document.getElementById("adTimer");
    const timerSecondsElement = document.getElementById("timerSeconds");
    const adButton = document.querySelector("#rewardAd button");

    if (timerElement) timerElement.style.display = "none";
    if (timerSecondsElement) timerSecondsElement.innerText = AD_CONFIG.TIMER_SECONDS;
    if (adButton) {
        adButton.disabled = false;
        adButton.style.opacity = "1";
        adButton.style.cursor = "pointer";
    }

    // Set cooldown
    localStorage.setItem("lastAdTime", Date.now());

    // Calculate reward
    const balance = getCurrentBalance();
    const level = calculateAdLevel(balance);
    const reward = getAdReward(level);

    // Get company ID
    const companyId = sessionStorage.getItem("companyId");
    if (!companyId) {
        alert("❌ Error: Not logged in");
        return;
    }

    // Claim reward from server
    try {
        const response = await fetch('/api/ad-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId, reward })
        });

        const data = await response.json();

        if (data.success) {
            alert(
                `✅ Ad completed!\n\n` +
                `💰 You earned: $${reward}\n` +
                `💳 New Balance: $${data.balance.toLocaleString()}\n` +
                `⭐ Level: ${data.level}`
            );

            // Reload page data
            if (typeof loadData === 'function') {
                loadData();
            }

            updateRewardDisplay();
            updateCooldownDisplay();
        } else {
            alert("❌ Failed to claim reward: " + (data.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Error claiming ad reward:", error);
        alert("❌ Network error. Please try again.");
    }
}

// Initialize ad system
function initAdSystem() {
    // Update displays
    updateRewardDisplay();
    updateCooldownDisplay();

    // Update cooldown every second
    setInterval(updateCooldownDisplay, 1000);

    console.log("✅ Rewarded Ad System initialized");
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAdSystem, 1000);
    });
} else {
    setTimeout(initAdSystem, 1000);
}
