class OfflineEarningsSystem {
  constructor() {
    this.lastClaimTime = 0;
    this.isClaiming = false;
  }

  async init() {
    // Check for offline earnings on page load
    await this.checkOfflineEarnings();
  }

  async checkOfflineEarnings() {
    if (this.isClaiming) return;
    
    try {
      this.isClaiming = true;
      const response = await fetch('/api/offline-earnings/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to claim offline earnings');
      }
      
      const data = await response.json();
      
      if (data.amount > 0) {
        this.showOfflineEarningsModal(data);
      }
    } catch (error) {
      console.error('Offline earnings check failed:', error);
    } finally {
      this.isClaiming = false;
    }
  }

  showOfflineEarningsModal(data) {
    const modal = document.createElement('div');
    modal.className = 'offline-earnings-modal';
    modal.innerHTML = `
      <div class="offline-earnings-content">
        <div class="offline-earnings-header">
          <div class="offline-earnings-icon">⏰💰</div>
          <h2>While You Were Away...</h2>
        </div>
        <div class="offline-earnings-body">
          <p>Your businesses kept working for you!</p>
          <div class="offline-earnings-amount">
            <span class="currency-symbol">$</span>
            <span class="amount-value">${this.formatNumber(data.amount)}</span>
          </div>
          <p class="offline-earnings-time">
            Earned over <strong>${data.hours}</strong> hours of offline progression
          </p>
          <div class="offline-earnings-info">
            <p>💡 Future upgrades can increase your offline cap and passive income rate!</p>
          </div>
        </div>
        <div class="offline-earnings-actions">
          <button class="btn btn-primary btn-large" onclick="this.closest('.offline-earnings-modal').remove(); updateBalance();">
            💰 Collect Earnings
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.offline-earnings-modal').remove();">
            Maybe Later
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate the amount
    this.animateAmount(modal.querySelector('.amount-value'), 0, data.amount, 1500);
    
    // Auto-remove after 10 seconds if not interacted with
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
    }, 10000);
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

// Initialize offline earnings system
const offlineEarningsSystem = new OfflineEarningsSystem();

// Add offline earnings styles
const offlineEarningsStyles = `
.offline-earnings-modal {
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

.offline-earnings-content {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #0f172a 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  animation: slideUp 0.4s ease-out;
}

.offline-earnings-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 0 0, rgba(255,255,255,0.1) 0, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(34,197,94,0.2) 0, transparent 50%);
  pointer-events: none;
}

.offline-earnings-header {
  margin-bottom: 30px;
}

.offline-earnings-icon {
  font-size: 60px;
  margin-bottom: 15px;
  animation: bounce 2s infinite;
}

.offline-earnings-header h2 {
  font-size: 28px;
  margin: 0;
  font-weight: 700;
}

.offline-earnings-body {
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
}

.offline-earnings-body p {
  font-size: 16px;
  margin: 0 0 20px 0;
  opacity: 0.9;
}

.offline-earnings-amount {
  font-size: 48px;
  font-weight: 900;
  margin: 20px 0;
  color: #ffd700;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.currency-symbol {
  font-size: 36px;
  opacity: 0.8;
}

.offline-earnings-time {
  font-size: 14px;
  opacity: 0.8;
  margin: 10px 0;
}

.offline-earnings-info {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  backdrop-filter: blur(10px);
}

.offline-earnings-info p {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

.offline-earnings-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.btn-large {
  padding: 15px 30px;
  font-size: 18px;
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
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@media (max-width: 768px) {
  .offline-earnings-content {
    padding: 30px 20px;
    margin: 20px;
  }
  
  .offline-earnings-amount {
    font-size: 36px;
  }
  
  .offline-earnings-icon {
    font-size: 48px;
  }
  
  .offline-earnings-actions {
    flex-direction: column;
  }
  
  .btn-large {
    width: 100%;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = offlineEarningsStyles;
document.head.appendChild(styleSheet);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => offlineEarningsSystem.init());
} else {
  offlineEarningsSystem.init();
}
