/**
 * Core Game Logic Utilities
 * Handles all game calculations and mechanics
 */

// Constants
const GAME_CONFIG = {
  BASE_INCOME_PER_CLICK: 1.5,
  LEVEL_MULTIPLIER: 0.5,
  OFFLINE_EARNINGS_CAP_HOURS: 12,
  OFFLINE_EARNINGS_RATE: 0.5, // 50% of hourly income
  UPGRADE_COST_MULTIPLIER: 2,
  COMPANY_PURCHASE_COST: 500,
  AD_REWARD_MULTIPLIER: 5,
  AD_DURATION_MS: 30000,
  DAILY_REWARD_BASE: 100,
  MAX_LEVEL_GAIN_PER_SESSION: 10,
};

/**
 * Calculate income per click based on companies and level
 */
function calculateIncomePerClick(companies, userLevel) {
  let totalIncome = 0;

  // Income from companies
  companies.forEach(company => {
    totalIncome += company.income_per_click;
  });

  // Add level bonus
  totalIncome += userLevel * GAME_CONFIG.LEVEL_MULTIPLIER;

  return Math.max(totalIncome, 0);
}

/**
 * Calculate offline earnings
 * @param {number} lastActiveTime - Timestamp of last activity
 * @param {number} incomePerHour - Income generated per hour
 * @returns {object} { amount, hours, capped }
 */
function calculateOfflineEarnings(lastActiveTime, incomePerHour) {
  const now = Date.now();
  const elapsedMs = now - lastActiveTime;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  // Cap at max hours
  const cappedHours = Math.min(
    elapsedHours,
    GAME_CONFIG.OFFLINE_EARNINGS_CAP_HOURS
  );

  const hourlyRate = incomePerHour * GAME_CONFIG.OFFLINE_EARNINGS_RATE;
  const amount = hourlyRate * cappedHours;

  return {
    amount: Math.round(amount * 100) / 100, // Round to 2 decimals
    hours: Math.round(cappedHours * 100) / 100,
    capped: elapsedHours > GAME_CONFIG.OFFLINE_EARNINGS_CAP_HOURS,
    elapsedHours: Math.round(elapsedHours * 100) / 100,
  };
}

/**
 * Calculate level based on total earned
 */
function calculateLevel(totalEarned) {
  return Math.max(1, Math.floor(Math.sqrt(totalEarned / 100)) + 1);
}

/**
 * Calculate upgrade cost for company
 */
function calculateUpgradeCost(currentLevel, baseCost) {
  return Math.round(
    baseCost * Math.pow(GAME_CONFIG.UPGRADE_COST_MULTIPLIER, currentLevel - 1)
  );
}

/**
 * Calculate new income after upgrade
 */
function calculateNewIncome(currentIncome) {
  return currentIncome * 1.5;
}

/**
 * Validate balance transaction
 */
function validateTransaction(currentBalance, amount, operation = 'spend') {
  if (operation === 'spend') {
    return {
      valid: currentBalance >= amount,
      message: currentBalance >= amount ? 'OK' : 'Insufficient funds',
    };
  }
  return { valid: true, message: 'OK' };
}

/**
 * Calculate daily reward
 */
function calculateDailyReward(streak) {
  const baseReward = GAME_CONFIG.DAILY_REWARD_BASE;
  const streakBonus = streak > 1 ? (streak - 1) * 10 : 0;
  return baseReward + streakBonus;
}

/**
 * Check if daily reward can be claimed today
 */
function canClaimDailyReward(lastClaimedDate) {
  if (!lastClaimedDate) return true;

  const today = new Date().toISOString().split('T')[0];
  const lastClaimed = new Date(lastClaimedDate).toISOString().split('T')[0];

  return today !== lastClaimed;
}

/**
 * Calculate streak for daily rewards
 */
function calculateStreak(lastClaimedDate) {
  if (!lastClaimedDate) return 1;

  const today = new Date();
  const lastClaimed = new Date(lastClaimedDate);

  // Check if claimed yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastClaimedDate_only = new Date(
    lastClaimed.getFullYear(),
    lastClaimed.getMonth(),
    lastClaimed.getDate()
  );
  const yesterday_only = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );

  return lastClaimedDate_only.getTime() === yesterday_only.getTime() ? 2 : 1;
}

/**
 * Apply multiplier to income
 */
function applyMultiplier(baseAmount, multiplierValue, multiplierUntil) {
  const now = Date.now();
  if (multiplierUntil > now) {
    return baseAmount * multiplierValue;
  }
  return baseAmount;
}

/**
 * Validate user data integrity
 */
function validateUserData(user) {
  const errors = [];

  if (!user.id || typeof user.id !== 'number') {
    errors.push('Invalid user ID');
  }
  if (typeof user.balance !== 'number' || user.balance < 0) {
    errors.push('Invalid balance (must be non-negative number)');
  }
  if (typeof user.total_earned !== 'number' || user.total_earned < 0) {
    errors.push('Invalid total_earned (must be non-negative number)');
  }
  if (typeof user.level !== 'number' || user.level < 1) {
    errors.push('Invalid level (must be positive number)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate achievement unlock info
 */
function checkAchievements(stats) {
  const achievements = [];

  if (stats.balance >= 1000) {
    achievements.push({ key: 'FIRST_THOUSAND', title: 'First Thousand' });
  }
  if (stats.balance >= 10000) {
    achievements.push({ key: 'TEN_THOUSAND', title: 'Ten Thousand' });
  }
  if (stats.balance >= 100000) {
    achievements.push({ key: 'HUNDRED_THOUSAND', title: 'Hundred Thousand' });
  }
  if (stats.level >= 10) {
    achievements.push({ key: 'LEVEL_10', title: 'Reaching Level 10' });
  }
  if (stats.level >= 50) {
    achievements.push({ key: 'LEVEL_50', title: 'Reaching Level 50' });
  }
  if (stats.totalClicks >= 1000) {
    achievements.push({ key: 'THOUSAND_CLICKS', title: '1000 Clicks' });
  }
  if (stats.totalAdsWatched >= 10) {
    achievements.push({ key: 'AD_WATCHER', title: 'Ad Watcher' });
  }

  return achievements;
}

module.exports = {
  GAME_CONFIG,
  calculateIncomePerClick,
  calculateOfflineEarnings,
  calculateLevel,
  calculateUpgradeCost,
  calculateNewIncome,
  validateTransaction,
  calculateDailyReward,
  canClaimDailyReward,
  calculateStreak,
  applyMultiplier,
  validateUserData,
  checkAchievements,
};
