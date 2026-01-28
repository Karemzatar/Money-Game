class TutorialSystem {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.tutorialSteps = [
      {
        id: 1,
        title: "Welcome to Money Game! 💰",
        content: "Let's learn how to build your business empire! In this game, you'll manage companies, earn money, and grow your wealth.",
        highlight: null,
        position: 'center'
      },
      {
        id: 2,
        title: "Your Balance 💵",
        content: "This is your current balance. You'll earn money by clicking and through passive income from your companies.",
        highlight: "#balanceText",
        position: 'bottom'
      },
      {
        id: 3,
        title: "Click to Earn! 🖱️",
        content: "Click this card to earn money. Each click adds to your balance based on your click multiplier.",
        highlight: "#mainClicker",
        position: 'top'
      },
      {
        id: 4,
        title: "Your Level 📈",
        content: "As you earn more money, you'll level up and unlock new features. The progress bar shows how close you are to the next level.",
        highlight: "#levelText",
        position: 'bottom'
      },
      {
        id: 5,
        title: "Click Multiplier ⚡",
        content: "This shows your current click multiplier. You can increase it through upgrades and special events.",
        highlight: "#multiplierText",
        position: 'bottom'
      },
      {
        id: 6,
        title: "Rewarded Ads 🎥",
        content: "Watch short video ads to get temporary 5x income boosts. This is a great way to accelerate your progress!",
        highlight: "#watchAdBtn",
        position: 'top'
      },
      {
        id: 7,
        title: "Your Companies 🏢",
        content: "Here you can see all your companies. Each company generates passive income automatically.",
        highlight: "#companiesList",
        position: 'top'
      },
      {
        id: 8,
        title: "Buy New Company ➕",
        content: "When you have enough money ($500), you can buy new companies to increase your passive income.",
        highlight: "#buyCompanyBtn",
        position: 'bottom'
      },
      {
        id: 9,
        title: "Tutorial Complete! 🎉",
        content: "Great job! You now know the basics. Remember to check back daily for rewards and watch your empire grow!",
        highlight: null,
        position: 'center'
      }
    ];
  }

  async init() {
    try {
      const response = await fetch('/api/tutorial/status');
      const data = await response.json();
      
      if (!data.completed && !data.skipped) {
        this.currentStep = data.currentStep - 1;
        this.showWelcomeModal();
      }
    } catch (error) {
      console.error('Failed to check tutorial status:', error);
    }
  }

  showWelcomeModal() {
    const modal = this.createModal();
    document.body.appendChild(modal);
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'tutorial-modal';
    modal.innerHTML = `
      <div class="tutorial-modal-content">
        <div class="tutorial-welcome">
          <h2>🎮 Welcome to Money Game!</h2>
          <p>Build your business empire and earn money in this exciting simulation game!</p>
          <div class="tutorial-video">
            <iframe 
              width="560" 
              height="315" 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
              frameborder="0" 
              allowfullscreen>
            </iframe>
          </div>
          <div class="tutorial-buttons">
            <button class="btn btn-primary" onclick="tutorialSystem.startTutorial()">
              🚀 Start Tutorial
            </button>
            <button class="btn btn-secondary" onclick="tutorialSystem.skipTutorial()">
              ⏭️ Skip
            </button>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  startTutorial() {
    this.closeWelcomeModal();
    this.isActive = true;
    this.showStep(0);
  }

  skipTutorial() {
    this.closeWelcomeModal();
    this.updateProgress(0, true, false);
  }

  closeWelcomeModal() {
    const modal = document.querySelector('.tutorial-modal');
    if (modal) {
      modal.remove();
    }
  }

  showStep(stepIndex) {
    if (stepIndex >= this.tutorialSteps.length) {
      this.completeTutorial();
      return;
    }

    this.currentStep = stepIndex;
    const step = this.tutorialSteps[stepIndex];
    
    // Remove existing highlights
    this.removeHighlights();
    
    // Add highlight if specified
    if (step.highlight) {
      this.highlightElement(step.highlight);
    }
    
    // Show tooltip
    this.showTooltip(step);
  }

  highlightElement(selector) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    element.classList.add('tutorial-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  removeHighlights() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  }

  showTooltip(step) {
    // Remove existing tooltip
    this.removeTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';
    tooltip.innerHTML = `
      <div class="tutorial-tooltip-content">
        <h3>${step.title}</h3>
        <p>${step.content}</p>
        <div class="tutorial-progress">
          Step ${step.id} of ${this.tutorialSteps.length}
        </div>
        <div class="tutorial-buttons">
          ${step.id > 1 ? '<button class="btn btn-secondary" onclick="tutorialSystem.previousStep()">← Previous</button>' : ''}
          <button class="btn btn-primary" onclick="tutorialSystem.nextStep()">
            ${step.id === this.tutorialSteps.length ? '✅ Complete' : 'Next →'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    if (step.highlight) {
      const element = document.querySelector(step.highlight);
      if (element) {
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        
        switch (step.position) {
          case 'top':
            tooltip.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
            tooltip.style.left = rect.left + 'px';
            break;
          case 'bottom':
            tooltip.style.top = (rect.bottom + 10) + 'px';
            tooltip.style.left = rect.left + 'px';
            break;
          case 'center':
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            break;
        }
      }
    }
  }

  removeTooltip() {
    const tooltip = document.querySelector('.tutorial-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  nextStep() {
    this.updateProgress(this.currentStep + 1, false, false);
    this.showStep(this.currentStep + 1);
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  completeTutorial() {
    this.removeHighlights();
    this.removeTooltip();
    this.isActive = false;
    this.updateProgress(this.tutorialSteps.length, true, false);
    
    // Show completion message
    this.showCompletionMessage();
  }

  showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'tutorial-completion';
    message.innerHTML = `
      <div class="tutorial-completion-content">
        <h2>🎉 Tutorial Complete!</h2>
        <p>You're now ready to build your business empire!</p>
        <p>💡 Pro tip: Check back daily for rewards and watch ads for bonuses!</p>
        <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
          Let's Play!
        </button>
      </div>
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentElement) {
        message.remove();
      }
    }, 5000);
  }

  async updateProgress(step, completed, skipped) {
    try {
      await fetch('/api/tutorial/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, completed, skipped })
      });
    } catch (error) {
      console.error('Failed to update tutorial progress:', error);
    }
  }

  // Public method to restart tutorial
  restart() {
    this.currentStep = 0;
    this.isActive = true;
    this.showStep(0);
  }
}

// Initialize tutorial system
const tutorialSystem = new TutorialSystem();

// Add tutorial styles
const tutorialStyles = `
.tutorial-modal {
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

.tutorial-modal-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 90%;
  text-align: center;
  color: white;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.tutorial-welcome h2 {
  font-size: 32px;
  margin-bottom: 20px;
}

.tutorial-welcome p {
  font-size: 18px;
  margin-bottom: 30px;
  opacity: 0.9;
}

.tutorial-video {
  margin: 30px 0;
  border-radius: 10px;
  overflow: hidden;
}

.tutorial-video iframe {
  width: 100%;
  height: 315px;
  border-radius: 10px;
}

.tutorial-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.tutorial-highlight {
  position: relative;
  z-index: 9999;
  box-shadow: 0 0 0 4px #ffd700, 0 0 20px rgba(255, 215, 0, 0.5);
  border-radius: 8px;
  animation: tutorialPulse 2s infinite;
}

@keyframes tutorialPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.tutorial-tooltip {
  position: fixed;
  z-index: 10001;
  max-width: 400px;
}

.tutorial-tooltip-content {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.tutorial-tooltip-content h3 {
  margin: 0 0 15px 0;
  font-size: 20px;
}

.tutorial-tooltip-content p {
  margin: 0 0 15px 0;
  line-height: 1.5;
}

.tutorial-progress {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 20px;
}

.tutorial-completion {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10002;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.tutorial-completion h2 {
  margin: 0 0 15px 0;
  font-size: 28px;
}

.tutorial-completion p {
  margin: 10px 0;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .tutorial-modal-content {
    padding: 20px;
    margin: 20px;
  }
  
  .tutorial-tooltip {
    max-width: 300px;
  }
  
  .tutorial-tooltip-content {
    padding: 15px;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = tutorialStyles;
document.head.appendChild(styleSheet);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => tutorialSystem.init());
} else {
  tutorialSystem.init();
}
