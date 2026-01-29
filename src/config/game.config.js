// Game Economy Configuration
module.exports = {
  GAME: {
    STARTING_BALANCE: 500,
    BASE_INCOME_CLICK: 1.5,
    LEVEL_MULTIPLIER: 0.5,
    COMPANY_BASE_COST: 500,
    UPGRADE_COST_FACTOR: 2.1, // Cost increases by 2.1x
    PASSIVE_INTERVAL_MS: 1000,
    OFFLINE_CAP_HOURS: 12,
    OFFLINE_RATE_PERCENT: 0.5, // 50% efficiency offline
    MAX_CLICKS_PER_SECOND: 20,
    MAX_TRANSACTION_VALUE: 1000000000000, // 1 Trillion safety cap
    DAILY_REWARD_BASE: 100,
    AD_REWARD_MULTIPLIER: 5,
    AD_COOLDOWN_MINUTES: 10,
  },

  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX: 100, // requests per window
  },

  // Level thresholds
  VISA_TIERS: {
    CLASSIC: 0,
    GOLD: 100000,
    PLATINUM: 500000,
    SIGNATURE: 1000000,
    INFINITE: 5000000,
  },
};
