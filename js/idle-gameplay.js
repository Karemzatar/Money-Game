class IdleGameplaySystem {
  constructor() {
    this.passiveIncomeRate = 0;
    this.totalIncomePerSecond = 0;
    this.lastUpdateTime = Date.now();
    this.upgrades = {
      clickPower: { level: 1, baseCost: 50, multiplier: 1.5 },
      passiveIncome: { level: 1, baseCost: 100, multiplier: 2 },
      offlineCap: { level: 1, baseCost: 200, multiplier: 1.8 },
      autoClicker: { level: 0, baseCost: 500, multiplier: 2.5 },
      efficiency: { level: 1, baseCost: 150, multiplier: 1.6 }
    };
    this.employees = [];
    this.randomEvents = [];
  }

  async init() {
    await this.loadGameData();
    this.startPassiveIncome();
    this.createUpgradesPanel();
    this.createEmployeesPanel();
    this.startRandomEvents();
  }

  async loadGameData() {
    try {
      // Load user upgrades
      const upgradesResponse = await fetch('/api/upgrades');
      const upgradesData = await upgradesResponse.json();
      
      upgradesData.forEach(upgrade => {
        if (this.upgrades[upgrade.upgrade_key]) {
          this.upgrades[upgrade.upgrade_key].level = upgrade.level;
        }
      });

      // Load user profile for passive income
      const profileResponse = await fetch('/api/game/profile');
      const profile = await profileResponse.json();
      
      this.passiveIncomeRate = profile.passive_income_rate || 0;
      this.calculateTotalIncome();

    } catch (error) {
      console.error('Failed to load game data:', error);
    }
  }

  calculateTotalIncome() {
    let total = 0;
    
    // Base passive income from upgrades
    total += this.upgrades.passiveIncome.level * 2;
    
    // Auto clicker contribution
    total += this.upgrades.autoClicker.level * 5;
    
    // Employee contributions
    this.employees.forEach(employee => {
      total += employee.income * employee.efficiency;
    });
    
    // Efficiency multiplier
    total *= this.upgrades.efficiency.level;
    
    this.totalIncomePerSecond = total;
    this.passiveIncomeRate = total;
  }

  startPassiveIncome() {
    setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
      const earnings = this.totalIncomePerSecond * deltaTime;
      
      if (earnings > 0) {
        this.addPassiveEarnings(earnings);
      }
      
      this.lastUpdateTime = now;
    }, 1000); // Update every second
  }

  async addPassiveEarnings(amount) {
    try {
      const response = await fetch('/api/game/passive-earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.updateBalanceDisplay(data.newBalance);
        
        // Show floating text for passive income
        if (amount > 0.01) {
          this.showFloatingText(`+$${amount.toFixed(2)}`, 'passive');
        }
      }
    } catch (error) {
      console.error('Failed to add passive earnings:', error);
    }
  }

  createUpgradesPanel() {
    const container = document.querySelector('.container');
    if (!container) return;

    const upgradesPanel = document.createElement('div');
    upgradesPanel.className = 'upgrades-panel glass-card';
    upgradesPanel.innerHTML = `
      <h3>🚀 Upgrades</h3>
      <div class="upgrades-grid" id="upgradesGrid">
        <!-- Upgrades will be populated here -->
      </div>
    `;

    container.appendChild(upgradesPanel);
    this.populateUpgrades();
  }

  populateUpgrades() {
    const grid = document.getElementById('upgradesGrid');
    if (!grid) return;

    grid.innerHTML = '';

    Object.entries(this.upgrades).forEach(([key, upgrade]) => {
      const cost = this.calculateUpgradeCost(key);
      const canAfford = this.canAffordUpgrade(cost);
      
      const upgradeCard = document.createElement('div');
      upgradeCard.className = `upgrade-card ${canAfford ? 'affordable' : 'locked'}`;
      upgradeCard.innerHTML = `
        <div class="upgrade-header">
          <h4>${this.getUpgradeName(key)}</h4>
          <span class="upgrade-level">Level ${upgrade.level}</span>
        </div>
        <div class="upgrade-description">
          ${this.getUpgradeDescription(key)}
        </div>
        <div class="upgrade-stats">
          ${this.getUpgradeStats(key)}
        </div>
        <div class="upgrade-footer">
          <span class="upgrade-cost">$${cost.toFixed(2)}</span>
          <button class="btn btn-small-primary" 
                  onclick="idleGameplaySystem.purchaseUpgrade('${key}')"
                  ${!canAfford ? 'disabled' : ''}>
            Upgrade
          </button>
        </div>
      `;

      grid.appendChild(upgradeCard);
    });
  }

  getUpgradeName(key) {
    const names = {
      clickPower: '💪 Click Power',
      passiveIncome: '💰 Passive Income',
      offlineCap: '⏰ Offline Cap',
      autoClicker: '🤖 Auto Clicker',
      efficiency: '⚡ Efficiency'
    };
    return names[key] || key;
  }

  getUpgradeDescription(key) {
    const descriptions = {
      clickPower: 'Increase earnings per click',
      passiveIncome: 'Generate money automatically',
      offlineCap: 'Increase maximum offline earnings time',
      autoClicker: 'Automatic clicking every second',
      efficiency: 'Boost all income sources'
    };
    return descriptions[key] || 'Upgrade this feature';
  }

  getUpgradeStats(key) {
    const stats = {
      clickPower: `+${(this.upgrades[key].level * 0.5).toFixed(1)} per click`,
      passiveIncome: `+$${(this.upgrades[key].level * 2).toFixed(1)}/sec`,
      offlineCap: `+${this.upgrades[key].level * 2} hours`,
      autoClicker: `${this.upgrades[key].level} clicks/sec`,
      efficiency: `x${this.upgrades[key].level} all income`
    };
    return stats[key] || '';
  }

  calculateUpgradeCost(key) {
    const upgrade = this.upgrades[key];
    return upgrade.baseCost * Math.pow(upgrade.multiplier, upgrade.level - 1);
  }

  canAffordUpgrade(cost) {
    const balanceElement = document.getElementById('balanceText');
    if (!balanceElement) return false;
    
    const currentBalance = parseFloat(balanceElement.textContent.replace(/[$,]/g, ''));
    return currentBalance >= cost;
  }

  async purchaseUpgrade(key) {
    const cost = this.calculateUpgradeCost(key);
    
    if (!this.canAffordUpgrade(cost)) {
      this.showNotification('Insufficient funds!', 'error');
      return;
    }

    try {
      const response = await fetch('/api/upgrades/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgradeKey: key, cost })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to purchase upgrade');
      }

      const data = await response.json();
      this.upgrades[key].level = data.newLevel;
      
      // Recalculate income if relevant
      if (key === 'passiveIncome' || key === 'autoClicker' || key === 'efficiency') {
        this.calculateTotalIncome();
      }

      this.updateBalanceDisplay(-cost);
      this.populateUpgrades();
      this.showNotification(`${this.getUpgradeName(key)} upgraded to level ${data.newLevel}!`, 'success');
      
      // Check for achievements
      this.checkAchievements();

    } catch (error) {
      console.error('Failed to purchase upgrade:', error);
      this.showNotification(error.message, 'error');
    }
  }

  createEmployeesPanel() {
    const container = document.querySelector('.container');
    if (!container) return;

    const employeesPanel = document.createElement('div');
    employeesPanel.className = 'employees-panel glass-card';
    employeesPanel.innerHTML = `
      <h3>👥 Employees</h3>
      <div class="employees-grid" id="employeesGrid">
        <div class="hire-employees-section">
          <p>Hire employees to generate passive income!</p>
          <div class="employee-options">
            <div class="employee-card" onclick="idleGameplaySystem.hireEmployee('basic')">
              <h4>👔 Basic Employee</h4>
              <p>+$1/sec</p>
              <span class="hire-cost">$250</span>
            </div>
            <div class="employee-card" onclick="idleGameplaySystem.hireEmployee('skilled')">
              <h4>👨‍💼 Skilled Employee</h4>
              <p>+$3/sec</p>
              <span class="hire-cost">$750</span>
            </div>
            <div class="employee-card" onclick="idleGameplaySystem.hireEmployee('expert')">
              <h4>👨‍🎓 Expert Employee</h4>
              <p>+$8/sec</p>
              <span class="hire-cost">$2000</span>
            </div>
          </div>
        </div>
        <div class="hired-employees-list" id="hiredEmployeesList">
          <!-- Hired employees will be shown here -->
        </div>
      </div>
    `;

    container.appendChild(employeesPanel);
  }

  async hireEmployee(type) {
    const costs = {
      basic: 250,
      skilled: 750,
      expert: 2000
    };

    const incomes = {
      basic: 1,
      skilled: 3,
      expert: 8
    };

    const cost = costs[type];
    
    if (!this.canAffordUpgrade(cost)) {
      this.showNotification('Insufficient funds to hire employee!', 'error');
      return;
    }

    try {
      const response = await fetch('/api/employees/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, cost, income: incomes[type] })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to hire employee');
      }

      const data = await response.json();
      
      // Add employee to local list
      this.employees.push({
        id: data.employeeId,
        type,
        income: incomes[type],
        efficiency: 1.0
      });

      this.calculateTotalIncome();
      this.updateBalanceDisplay(-cost);
      this.updateEmployeesList();
      this.showNotification(`Hired ${type} employee!`, 'success');

    } catch (error) {
      console.error('Failed to hire employee:', error);
      this.showNotification(error.message, 'error');
    }
  }

  updateEmployeesList() {
    const list = document.getElementById('hiredEmployeesList');
    if (!list) return;

    if (this.employees.length === 0) {
      list.innerHTML = '<p>No employees hired yet.</p>';
      return;
    }

    list.innerHTML = this.employees.map(employee => `
      <div class="hired-employee">
        <span>${this.getEmployeeIcon(employee.type)} ${employee.type}</span>
        <span>+$${employee.income}/sec</span>
      </div>
    `).join('');
  }

  getEmployeeIcon(type) {
    const icons = {
      basic: '👔',
      skilled: '👨‍💼',
      expert: '👨‍🎓'
    };
    return icons[type] || '👤';
  }

  startRandomEvents() {
    // Random events occur every 2-5 minutes
    const scheduleNextEvent = () => {
      const delay = Math.random() * 180000 + 120000; // 2-5 minutes
      setTimeout(() => {
        this.triggerRandomEvent();
        scheduleNextEvent();
      }, delay);
    };
    
    // Start first event after 30 seconds
    setTimeout(scheduleNextEvent, 30000);
  }

  triggerRandomEvent() {
    const events = [
      {
        type: 'bonus',
        title: '💰 Market Boom!',
        description: 'Your businesses are extra profitable for the next minute!',
        effect: () => this.applyIncomeMultiplier(2, 60000)
      },
      {
        type: 'penalty',
        title: '😰 Market Crash',
        description: 'Income reduced by 50% for 30 seconds',
        effect: () => this.applyIncomeMultiplier(0.5, 30000)
      },
      {
        type: 'bonus',
        title: '🎉 Lucky Day!',
        description: 'You found $100 lying around!',
        effect: () => this.addBonusMoney(100)
      },
      {
        type: 'neutral',
        title: '📊 Tax Season',
        description: 'Nothing happens... yet.',
        effect: () => {}
      }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    this.showRandomEventModal(event);
    event.effect();
  }

  showRandomEventModal(event) {
    const modal = document.createElement('div');
    modal.className = 'random-event-modal';
    modal.innerHTML = `
      <div class="random-event-content">
        <h3>${event.title}</h3>
        <p>${event.description}</p>
        <button class="btn btn-primary" onclick="this.closest('.random-event-modal').remove()">
          OK
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
    }, 5000);
  }

  applyIncomeMultiplier(multiplier, duration) {
    const originalRate = this.totalIncomePerSecond;
    this.totalIncomePerSecond *= multiplier;
    
    setTimeout(() => {
      this.totalIncomePerSecond = originalRate;
    }, duration);
  }

  async addBonusMoney(amount) {
    try {
      const response = await fetch('/api/game/bonus-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.updateBalanceDisplay(data.newBalance);
        this.showFloatingText(`+$${amount}`, 'bonus');
      }
    } catch (error) {
      console.error('Failed to add bonus money:', error);
    }
  }

  updateBalanceDisplay(change) {
    const balanceElement = document.getElementById('balanceText');
    if (!balanceElement) return;
    
    const currentBalance = parseFloat(balanceElement.textContent.replace(/[$,]/g, ''));
    const newBalance = currentBalance + change;
    balanceElement.textContent = `$${newBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  showFloatingText(text, type) {
    const floatingText = document.createElement('div');
    floatingText.className = `floating-text ${type}`;
    floatingText.textContent = text;
    
    // Position near the clicker
    const clicker = document.getElementById('mainClicker');
    if (clicker) {
      const rect = clicker.getBoundingClientRect();
      floatingText.style.left = rect.left + rect.width / 2 + 'px';
      floatingText.style.top = rect.top + 'px';
    }
    
    document.body.appendChild(floatingText);
    
    // Remove after animation
    setTimeout(() => {
      floatingText.remove();
    }, 2000);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `game-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  checkAchievements() {
    // Check for various achievements
    if (this.upgrades.clickPower.level >= 10) {
      this.unlockAchievement('click_master', 'Click Master');
    }
    
    if (this.upgrades.passiveIncome.level >= 15) {
      this.unlockAchievement('passive_income_king', 'Passive Income King');
    }
    
    if (this.employees.length >= 10) {
      this.unlockAchievement('employer', 'Employer');
    }
  }

  async unlockAchievement(key, name) {
    try {
      await fetch('/api/achievements/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementKey: key })
      });
      
      this.showNotification(`🏆 Achievement Unlocked: ${name}!`, 'achievement');
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
    }
  }
}

// Initialize idle gameplay system
const idleGameplaySystem = new IdleGameplaySystem();

// Add idle gameplay styles
const idleGameplayStyles = `
.upgrades-panel, .employees-panel {
  margin: 20px 0;
  padding: 20px;
}

.upgrades-grid, .employees-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.upgrade-card, .employee-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upgrade-card.affordable {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.upgrade-card.affordable:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(34, 197, 94, 0.3);
}

.upgrade-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.upgrade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.upgrade-header h4 {
  margin: 0;
  font-size: 16px;
}

.upgrade-level {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.upgrade-description {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 10px;
}

.upgrade-stats {
  font-size: 13px;
  color: #22c55e;
  margin-bottom: 15px;
}

.upgrade-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upgrade-cost {
  font-weight: 600;
  color: #ffd700;
}

.employee-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 15px 0;
}

.employee-card {
  text-align: center;
  padding: 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.employee-card:hover {
  transform: translateY(-2px);
  border-color: #3b82f6;
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3);
}

.employee-card h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.employee-card p {
  margin: 0 0 10px 0;
  color: #22c55e;
  font-weight: 600;
}

.hire-cost {
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 600;
}

.hired-employees-list {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hired-employee {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  margin-bottom: 10px;
}

.random-event-modal {
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
}

.random-event-content {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.random-event-content h3 {
  margin: 0 0 15px 0;
  font-size: 24px;
}

.random-event-content p {
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.floating-text {
  position: fixed;
  font-weight: bold;
  font-size: 18px;
  pointer-events: none;
  z-index: 1000;
  animation: floatUp 2s ease-out forwards;
}

.floating-text.passive {
  color: #22c55e;
}

.floating-text.bonus {
  color: #ffd700;
  font-size: 24px;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-50px);
  }
}

.game-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  transform: translateX(400px);
  transition: transform 0.3s ease;
  z-index: 10001;
}

.game-notification.show {
  transform: translateX(0);
}

.game-notification.success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.game-notification.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.game-notification.achievement {
  background: linear-gradient(135deg, #ffd700 0%, #f59e0b 100%);
  color: #000;
}

@media (max-width: 768px) {
  .upgrades-grid, .employees-grid {
    grid-template-columns: 1fr;
  }
  
  .employee-options {
    grid-template-columns: 1fr;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = idleGameplayStyles;
document.head.appendChild(styleSheet);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => idleGameplaySystem.init());
} else {
  idleGameplaySystem.init();
}
