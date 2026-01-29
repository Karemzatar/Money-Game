
// Offline Earnings Handler

function showOfflineEarningsModal(info) {
    if (!info || !info.amount || info.amount <= 0) return;

    const overlay = document.createElement('div');
    overlay.id = 'offline-earnings-modal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(10, 14, 39, 0.85)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease-out';

    const card = document.createElement('div');
    card.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #0f172a 100%)';
    card.style.borderRadius = '20px';
    card.style.padding = '32px 28px';
    card.style.maxWidth = '420px';
    card.style.width = '90%';
    card.style.color = '#ffffff';
    card.style.boxShadow = '0 18px 60px rgba(0,0,0,0.5)';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    card.innerHTML = `
    <div style="position:absolute; inset:0; opacity:0.15; background-image:
      radial-gradient(circle at 0 0, rgba(255,255,255,0.3) 0, transparent 55%),
      radial-gradient(circle at 100% 100%, rgba(34,197,94,0.4) 0, transparent 60%);">
    </div>
    <div style="position:relative; z-index:1;">
      <div style="font-size:42px; margin-bottom:12px;">⏱️💰</div>
      <h2 style="margin:0 0 8px 0; font-size:24px; font-weight:800;">While you were away...</h2>
      <p style="margin:0 0 18px 0; font-size:15px; opacity:0.9;">
        Your businesses kept working for you! You earned:
      </p>
      <div id="offlineAmountDisplay" style="
        font-size:34px;
        font-weight:900;
        margin-bottom:12px;
        letter-spacing:0.03em;
      ">$0.00</div>
      <p style="margin:0 0 18px 0; font-size:13px; opacity:0.9;">
        Based on up to <strong>${info.hours || 'several'}</strong> hours of offline progression.
      </p>
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
        <button id="offlineCollectBtn" class="btn btn-primary" style="flex:1; min-width:120px;">
          Collect Earnings
        </button>
        <button id="offlineCloseBtn" class="btn btn-small-secondary" style="min-width:110px;">
          Maybe Later
        </button>
      </div>
      <p style="margin-top:14px; font-size:12px; opacity:0.85;">
        Future upgrades will increase your offline cap and passive income rate.
      </p>
    </div>
  `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Fade in
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
    });

    // Animate number if core animations are available
    const amountElement = document.getElementById('offlineAmountDisplay');
    const amount = Number(info.amount) || 0;
    const formatted = amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    if (window.Animations && typeof Animations.countUp === 'function') {
        Animations.countUp(
            amountElement,
            0,
            amount,
            900
        );
    } else {
        amountElement.textContent = `$${formatted}`;
    }

    function closeModal() {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 250);
    }

    document.getElementById('offlineCollectBtn').addEventListener('click', () => {
        callClaimEndpoint(formatted);
        closeModal();
    });

    document.getElementById('offlineCloseBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

function callClaimEndpoint(formattedAmount) {
    fetch('/api/game/claim-offline-earnings', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (window.notifications) {
                    window.notifications.money(
                        `Collected $${formattedAmount} in offline earnings!`,
                        4000
                    );
                }
                if (window.soundManager) {
                    window.soundManager.play('money');
                }
                // Update UI global
                if (typeof fetchProfile === 'function') fetchProfile();
            }
        })
        .catch(console.error);
}

// Check on load
document.addEventListener('DOMContentLoaded', () => {
    // Only check if we are on the game page (indicated by presence of stats)
    if (!document.getElementById('balanceText')) return;

    fetch('/api/game/profile')
        .then(res => res.ok ? res.json() : null)
        .then(userData => {
            if (userData && userData.offlineEarnings && userData.offlineEarnings.amount > 0) {
                showOfflineEarningsModal(userData.offlineEarnings);
            }
        })
        .catch(err => console.warn('Offline checks failed', err));
});
