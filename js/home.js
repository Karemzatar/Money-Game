let balance = 0;
let companyId = sessionStorage.getItem("companyId");
let currentLevel = 0;

if (!companyId) window.location.href = "/";

// Load data
function loadData() {
  fetch(`/data/${companyId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("companyName").innerText = data.company;
      document.getElementById("cardNumber").innerText = data.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');

      balance = Number(data.balance);
      currentLevel = data.level || 0;

      updateUI(data);
    })
    .catch(err => console.error(err));
}

function updateUI(data) {
  document.getElementById("balance").innerText = `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  document.getElementById("companyLevel").innerText = data.level || 0;
  document.getElementById("sharePrice").innerText = `$${(data.sharePrice || 0).toFixed(2)}`;

  // Update Earn Rate Display
  // Base 2.50 + (Level * 0.50)
  let rate = 2.50 + (data.level * 0.50);
  // Partnership bonus check? We don't have partnership count easily accessible unless we count 'data.partners'
  if (data.partners && data.partners.length > 0) {
    rate = rate * (1 + (data.partners.length * 0.25));
  }
  document.getElementById("earnRate").innerText = rate.toFixed(2);

  document.getElementById("visaTypeDisplay").innerText = data.visaType || 'Classic';
}

function earn() {
  fetch(`/earn/${companyId}`, { method: "POST" })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      balance = data.balance;
      // Optimistic UI update
      document.getElementById("balance").innerText = `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      document.getElementById("companyLevel").innerText = data.level;
      loadData(); // Reload for accurate stats
    });
}

function logout() {
  sessionStorage.removeItem("companyId");
  window.location.href = "/";
}

loadData();
