class DailyRewardsSystem {
  constructor() {
    this.currentStreak = 0;
    this.canClaim = false;
    this.hasClaimed = false;
  }

  async init() {
    await this.checkDailyRewardStatus();
    this.createDailyRewardWidget();
  }

  async checkDailyRewardStatus() {
    try {
      const response = await fetch('/api/daily-reward/status');
      const data = await response.json();
      
      this.hasClaimed = data.claimed;
      this.currentStreak = data.streak;
      this.canClaim = !data.claimed;
      
      return data;
    } catch (error) {
      console.error('Failed to check daily reward status:', error);
      return { claimed: true, streak: 0 };
    }
  }

  createDailyRewardWidget() {
    // Remove existing widget if present
    const existing = document.querySelector('.daily-reward-widget');
    if (existing) existing.remove();

    const widget = document.createElement('div');
    widget.className = 'daily-reward-widget';
    
    if (this.hasClaimed) {
      widget.innerHTML = `
        <div class="daily-reward-claimed">
          <div class="daily-reward-icon">✅</div>
          <div class="daily-reward-info">
            <h4>Daily Reward Claimed</h4>
            <p>Current streak: ${this.currentStreak} days</p>
            <small>Come back tomorrow for more rewards!</small>
          </div>
        </div>
      `;
    } else {
      const nextReward = this.calculateNextReward();
      widget.innerHTML = `
        <div class="daily-reward-available" onclick="dailyRewardsSystem.claimReward()">
          <div class="daily-reward-icon pulse">🎁</div>
          <div class="daily-reward-info">
            <h4>Daily Reward Available!</h4>
            <p>Claim: $${nextReward}</p>
            <small>Current streak: ${this.currentStreak} days</small>
          </div>
          <div class="daily-reward-claim-btn">Claim</div>
        </div>
      `;
    }

    // Insert into the page
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(widget, container.firstChild);
    }
  }

  calculateNextReward() {
    const baseAmount = 50;
    const streakBonus = (this.currentStreak - 1) * 10;
    return baseAmount + streakBonus;
  }

  async claimReward() {
    if (!this.canClaim || this.hasClaimed) return;

    try {
      const response = await fetch('/api/daily-reward/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to claim reward');
      }

      const data = await response.json();
      this.showRewardModal(data);
      this.hasClaimed = true;
      this.currentStreak = data.streak;
      
      // Update widget
      setTimeout(() => this.createDailyRewardWidget(), 2000);
      
      // Update balance display
      if (typeof updateBalance === 'function') {
        updateBalance();
      }

    } catch (error) {
      console.error('Failed to claim daily reward:', error);
      this.showErrorNotification(error.message);
    }
  }

  showRewardModal(data) {
    const modal = document.createElement('div');
    modal.className = 'daily-reward-modal';
    modal.innerHTML = `
      <div class="daily-reward-modal-content">
        <div class="daily-reward-success">
          <div class="success-icon">🎉</div>
          <h2>Daily Reward Claimed!</h2>
          <div class="reward-amount">
            <span class="currency-symbol">$</span>
            <span class="amount-value">${this.formatNumber(data.amount)}</span>
          </div>
          <div class="streak-info">
            <p>🔥 ${data.streak} Day Streak!</p>
            ${data.streak > 1 ? `<p>+${(data.streak - 1) * 10} streak bonus!</p>` : ''}
          </div>
          <div class="next-reward-preview">
            <p>Tomorrow's reward: <strong>$${this.formatNumber(data.amount + 10)}</strong></p>
          </div>
          <button class="btn btn-primary" onclick="this.closest('.daily-reward-modal').remove()">
            Awesome!
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate the amount
    this.animateAmount(modal.querySelector('.amount-value'), 0, data.amount, 1000);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
    }, 5000);
  }

  showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'daily-reward-error';
    notification.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  animateAmount(element, start, end, duration) {
    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const current = start + (end - start) * this.easeOutQuart(progress);
      element.textContent = this.formatNumber(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  formatNumber(num) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

// Initialize daily rewards system
const dailyRewardsSystem = new DailyRewardsSystem();

// Add daily rewards styles
const dailyRewardsStyles = `
.daily-reward-widget {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
  position: relative;
  overflow: hidden;
}

.daily-reward-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 0 0, rgba(255,255,255,0.1) 0, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(252, 211, 77, 0.2) 0, transparent 50%);
  pointer-events: none;
}

.daily-reward-claimed,
.daily-reward-available {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  z-index: 1;
}

.daily-reward-available {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.daily-reward-available:hover {
  transform: translateY(-2px);
}

.daily-reward-icon {
  font-size: 40px;
  min-width: 50px;
  text-align: center;
}

.daily-reward-icon.pulse {
  animation: pulse 2s infinite;
}

.daily-reward-info h4 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.daily-reward-info p {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 700;
}

.daily-reward-info small {
  opacity: 0.8;
  font-size: 12px;
}

.daily-reward-claim-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.daily-reward-available:hover .daily-reward-claim-btn {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.daily-reward-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

.daily-reward-modal-content {
  background: linear-gradient(135deg, #10b981 0%, #059669 50%, #064e3b 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  animation: slideUp 0.4s ease-out;
}

.daily-reward-modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 0 0, rgba(255,255,255,0.1) 0, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.2) 0, transparent 50%);
  pointer-events: none;
}

.success-icon {
  font-size: 60px;
  margin-bottom: 20px;
  animation: bounce 1s ease-out;
}

.daily-reward-success h2 {
  font-size: 28px;
  margin: 0 0 20px 0;
  font-weight: 700;
}

.reward-amount {
  font-size: 42px;
  font-weight: 900;
  margin: 20px 0;
  color: #ffd700;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.streak-info {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  margin: 20px 0;
  backdrop-filter: blur(10px);
}

.streak-info p {
  margin: 5px 0;
  font-size: 16px;
}

.next-reward-preview {
  margin: 20px 0;
  opacity: 0.9;
}

.daily-reward-error {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
  z-index: 10001;
  transform: translateX(400px);
  transition: transform 0.3s ease;
}

.daily-reward-error.show {
  transform: translateX(0);
}

.error-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-icon {
  font-size: 20px;
}

.error-message {
  font-weight: 600;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@media (max-width: 768px) {
  .daily-reward-widget {
    padding: 15px;
    margin: 10px;
  }
  
  .daily-reward-icon {
    font-size: 32px;
    min-width: 40px;
  }
  
  .daily-reward-info h4 {
    font-size: 16px;
  }
  
  .daily-reward-modal-content {
    padding: 30px 20px;
    margin: 20px;
  }
  
  .reward-amount {
    font-size: 32px;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = dailyRewardsStyles;
document.head.appendChild(styleSheet);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => dailyRewardsSystem.init());
} else {
  dailyRewardsSystem.init();
}
