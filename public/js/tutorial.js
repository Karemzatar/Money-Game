
// Interactive Tutorial System

class TutorialSystem {
    constructor() {
        this.active = false;
        this.currentStep = 0;
        this.overlay = null;
        this.tooltip = null;

        this.steps = [
            {
                elementId: 'mainClicker',
                text: '👋 Welcome! Start by CLICKING this card to earn your first dollars.',
                action: 'click'
            },
            {
                elementId: 'buyCompanyBtn',
                text: 'Once you have $500, click here to BUY your first company for passive income.',
                action: 'wait_balance_500' // Custom logic
            },
            {
                elementId: 'companiesList',
                text: 'Your companies will appear here. Upgrade them to earn more!',
                action: 'next_btn'
            }
        ];

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(() => this.checkStatus(), 1000));
        } else {
            setTimeout(() => this.checkStatus(), 1000);
        }
    }

    async checkStatus() {
        try {
            const res = await fetch('/api/game/tutorial-status');
            const data = await res.json();

            // Should show?
            if (!data.completed && !data.skipped) {
                // If onboarding modal is showing, wait for it
                if (document.getElementById('onboarding-modal') && document.getElementById('onboarding-modal').style.opacity !== '0') {
                    // Poll until onboarding is gone
                    const check = setInterval(() => {
                        if (!document.getElementById('onboarding-modal') || document.getElementById('onboarding-modal').style.opacity === '0') {
                            clearInterval(check);
                            this.start(data.current_step);
                        }
                    }, 1000);
                } else {
                    this.start(data.current_step);
                }
            }
        } catch (e) {
            console.error('Tutorial check failed', e);
        }
    }

    start(stepIndex) {
        if (this.active) return;
        this.active = true;
        this.currentStep = stepIndex || 0;
        this.createUI();
        this.showStep(this.currentStep);
    }

    createUI() {
        // Dark overlay (with hole? tough to do simply without libraries. We'll use high z-index relative positioning)
        // Simple approach: Box pointing to element.

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tutorial-tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: white;
            color: #1e293b;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            z-index: 100001;
            max-width: 300px;
            font-weight: 500;
            transition: all 0.3s ease;
            opacity: 0;
            pointer-events: auto;
        `;
        document.body.appendChild(this.tooltip);

        // Add skip button
        const skipBtn = document.createElement('button');
        skipBtn.innerText = 'Skip Tutorial';
        skipBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 100002;
            padding: 8px 16px;
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px;
            cursor: pointer;
        `;
        skipBtn.onclick = () => this.skip();
        document.body.appendChild(skipBtn);
        this.skipBtn = skipBtn;
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[index];
        const el = document.getElementById(step.elementId);

        if (!el) {
            console.warn('Tutorial element missing:', step.elementId);
            // Try next step
            this.advance(index + 1);
            return;
        }

        // Highlight element
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add highlight class
        el.classList.add('tutorial-highlight');
        el.style.position = 'relative';
        el.style.zIndex = '100000';
        el.style.boxShadow = '0 0 0 4px #fbbf24, 0 0 0 100vw rgba(0,0,0,0.7)'; // Spotlight effect hack

        // Position tooltip
        const rect = el.getBoundingClientRect();
        const top = rect.bottom + 20 + window.scrollY;
        const left = rect.left + (rect.width / 2) - 150;

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.opacity = '1';

        let content = `<p style="margin-bottom:15px;line-height:1.5;">${step.text}</p>`;

        if (step.action === 'next_btn') {
            content += `<button class="btn btn-small-primary" id="tut-next-btn">Next ➡</button>`;
        }

        this.tooltip.innerHTML = content;

        // Logic
        if (step.action === 'click') {
            const handler = () => {
                el.removeEventListener('click', handler);
                this.cleanupStep(el);
                this.advance(index + 1);
            };
            el.addEventListener('click', handler);
        } else if (step.action === 'next_btn') {
            document.getElementById('tut-next-btn').onclick = () => {
                this.cleanupStep(el);
                this.advance(index + 1);
            };
        } else if (step.action === 'wait_balance_500') {
            // Check balance periodically
            const check = setInterval(() => {
                // Get balance from UI or global state
                if (window.userData && window.userData.balance >= 500) {
                    clearInterval(check);
                    this.tooltip.innerHTML = `<p>Great! Now click the button to buy!</p>`;
                    el.addEventListener('click', () => {
                        this.cleanupStep(el);
                        this.advance(index + 1);
                    }, { once: true });
                }
                // Also allow skipping if they click anyway (and have funds)
            }, 1000);

            // If manual skip
            content += `<div style="margin-top:10px;font-size:12px;opacity:0.7;">(Or earn $500 to continue)</div>`;
            this.tooltip.innerHTML = content;
        }
    }

    cleanupStep(el) {
        if (el) {
            el.classList.remove('tutorial-highlight');
            el.style.zIndex = '';
            el.style.boxShadow = '';
            // Reset position if we messed it up, but usually relative is fine.
            // However, sticky/fixed elements check
        }
    }

    async advance(nextIndex) {
        // Save progress
        await fetch('/api/game/tutorial-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: nextIndex })
        });

        this.currentStep = nextIndex;
        setTimeout(() => this.showStep(nextIndex), 500);
    }

    async complete() {
        await fetch('/api/game/tutorial-complete', { method: 'POST' });
        if (window.notifications) window.notifications.success('Tutorial Completed! You are on your own now!', 5000);
        this.teardown();
    }

    async skip() {
        await fetch('/api/game/tutorial-skip', { method: 'POST' });
        this.teardown();
        const currentEl = document.getElementById(this.steps[this.currentStep]?.elementId);
        this.cleanupStep(currentEl);
    }

    teardown() {
        this.active = false;
        if (this.tooltip) this.tooltip.remove();
        if (this.skipBtn) this.skipBtn.remove();
    }
}

window.tutorialSystem = new TutorialSystem();
