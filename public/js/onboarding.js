// ========================================
// ONBOARDING & FIRST-TIME EXPERIENCE
// ========================================

class OnboardingSystem {
    constructor() {
        this.hasSeenIntro = localStorage.getItem('hasSeenIntro') === 'true';
        this.introVideoUrl = '/videos/intro.mp4'; // Optional intro video
    }

    // Check if user should see onboarding
    shouldShowOnboarding() {
        return !this.hasSeenIntro;
    }

    // Mark onboarding as complete
    markComplete() {
        localStorage.setItem('hasSeenIntro', 'true');
        this.hasSeenIntro = true;
    }

    // Reset onboarding (for testing)
    reset() {
        localStorage.removeItem('hasSeenIntro');
        this.hasSeenIntro = false;
    }

    // Show intro modal
    show() {
        const modal = this.createModal();
        document.body.appendChild(modal);

        // Fade in
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        // Play sound
        if (window.soundManager) {
            window.soundManager.play('notification');
        }
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'onboarding-modal';
        modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(10, 14, 39, 0.95);
      backdrop-filter: blur(10px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

        const content = document.createElement('div');
        content.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 24px;
      padding: 48px;
      max-width: 600px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      position: relative;
      overflow: hidden;
    `;

        // Background pattern
        const pattern = document.createElement('div');
        pattern.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.1;
      background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 20px 20px;
    `;
        content.appendChild(pattern);

        // Content container
        const innerContent = document.createElement('div');
        innerContent.style.cssText = 'position: relative; z-index: 1;';

        innerContent.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 24px; animation: bounce 1s infinite;">💰</div>
      <h1 style="color: white; font-size: 36px; font-weight: 800; margin-bottom: 16px; font-family: 'Poppins', sans-serif;">
        Welcome to Money Game!
      </h1>
      <p style="color: rgba(255,255,255,0.9); font-size: 18px; line-height: 1.6; margin-bottom: 32px;">
        Build your business empire from scratch. Make smart decisions, grow your wealth, and become a legendary entrepreneur!
      </p>
      
      <div style="background: rgba(0,0,0,0.2); border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: left;">
        <h3 style="color: white; font-size: 20px; margin-bottom: 16px; font-weight: 700;">🎯 How to Play:</h3>
        <ul style="color: rgba(255,255,255,0.9); font-size: 16px; line-height: 2; list-style: none; padding: 0;">
          <li>💸 <strong>Earn Money</strong> - Click to generate income</li>
          <li>📈 <strong>Level Up</strong> - Grow your balance to unlock new tiers</li>
          <li>🎥 <strong>Watch Ads</strong> - Get bonus rewards every 10 minutes</li>
          <li>🤝 <strong>Partner Up</strong> - Team with others for +25% earnings</li>
          <li>🏆 <strong>Achieve Goals</strong> - Complete missions and unlock achievements</li>
        </ul>
      </div>

      <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
        <button id="watch-intro-btn" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        ">
          ▶️ Watch Intro Video
        </button>
        <button id="skip-intro-btn" style="
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        ">
          ⏭️ Skip & Start Playing
        </button>
      </div>
    `;

        content.appendChild(innerContent);
        modal.appendChild(content);

        // Add hover effects
        const watchBtn = innerContent.querySelector('#watch-intro-btn');
        const skipBtn = innerContent.querySelector('#skip-intro-btn');

        watchBtn.onmouseenter = () => {
            watchBtn.style.transform = 'translateY(-2px)';
            watchBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        };
        watchBtn.onmouseleave = () => {
            watchBtn.style.transform = 'translateY(0)';
            watchBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        };

        skipBtn.onmouseenter = () => {
            skipBtn.style.background = 'rgba(255,255,255,0.3)';
        };
        skipBtn.onmouseleave = () => {
            skipBtn.style.background = 'rgba(255,255,255,0.2)';
        };

        // Button click handlers
        watchBtn.onclick = () => {
            if (window.soundManager) window.soundManager.play('click');
            this.showIntroVideo(modal);
        };

        skipBtn.onclick = () => {
            if (window.soundManager) window.soundManager.play('click');
            this.closeModal(modal);
        };

        // Add bounce animation
        const style = document.createElement('style');
        style.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
    `;
        document.head.appendChild(style);

        return modal;
    }

    showIntroVideo(modal) {
        const videoContainer = document.createElement('div');
        videoContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 100000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

        const video = document.createElement('video');
        video.src = this.introVideoUrl;
        video.controls = true;
        video.autoplay = true;
        video.style.cssText = `
      max-width: 90%;
      max-height: 70vh;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

        // Handle video not found
        video.onerror = () => {
            if (window.notifications) {
                window.notifications.warning('Intro video not available. Starting game!');
            }
            this.closeModal(modal);
            document.body.removeChild(videoContainer);
        };

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = `
      margin-top: 20px;
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    `;

        closeBtn.onclick = () => {
            if (window.soundManager) window.soundManager.play('click');
            this.closeModal(modal);
            document.body.removeChild(videoContainer);
        };

        // Auto-close when video ends
        video.onended = () => {
            setTimeout(() => {
                this.closeModal(modal);
                document.body.removeChild(videoContainer);
            }, 1000);
        };

        videoContainer.appendChild(video);
        videoContainer.appendChild(closeBtn);
        document.body.appendChild(videoContainer);
    }

    closeModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);

        this.markComplete();

        // Show welcome notification
        if (window.notifications) {
            setTimeout(() => {
                window.notifications.success('Welcome to Money Game! Let\'s build your empire! 🚀', 4000);
            }, 500);
        }
    }
}

// Initialize onboarding system
window.onboardingSystem = new OnboardingSystem();

// Auto-show on first visit (call this after page load)
window.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other systems to initialize
    setTimeout(() => {
        if (window.onboardingSystem && window.onboardingSystem.shouldShowOnboarding()) {
            window.onboardingSystem.show();
        }
    }, 1000);
});

console.log('🎬 Onboarding System Initialized');
