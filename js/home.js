let balance = 0;
let companyId = sessionStorage.getItem("companyId");
let currentLevel = 0;
let currentData = null;

if (!companyId) window.location.href = "/";

// Determine visa type based on balance
function determineVisaType(bal) {
  if (bal >= 5000000) return "Visa Infinite";
  if (bal >= 1000000) return "Visa Signature";
  if (bal >= 500000) return "Visa Platinum";
  if (bal >= 100000) return "Visa Gold";
  return "Visa Classic";
}

// Load data
function loadData() {
  fetch(`/data/${companyId}`)
    .then(res => res.json())
    .then(data => {
      currentData = data;
      
      document.getElementById("companyName").innerText = data.company;
      document.getElementById("companyNameSmall").innerText = data.company;
      document.getElementById("managerName").innerText = data.manager || "N/A";
      document.getElementById("companyId").innerText = companyId;
      
      // Set company image
      if (data.imageUrl) {
        document.getElementById("companyImage").src = data.imageUrl;
      }
      
      document.getElementById("cardNumber").innerText = data.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
      document.getElementById("visaCompanyName").innerText = data.company;

      balance = Number(data.balance);
      currentLevel = data.level || 0;
      
      // Calculate created date
      const createdDate = new Date(data.createdAt);
      document.getElementById("createdDate").innerText = createdDate.toLocaleDateString();
      
      // Calculate account age
      const now = new Date();
      const diffTime = Math.abs(now - createdDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      document.getElementById("accountAge").innerText = diffDays + " days";

      updateUI(data);
    })
    .catch(err => console.error(err));
}

function updateUI(data) {
  document.getElementById("balance").innerText = `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  document.getElementById("totalBalance").innerText = `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  document.getElementById("companyLevel").innerText = data.level || 0;
  document.getElementById("levelDisplay").innerText = data.level || 0;
  document.getElementById("sharePrice").innerText = `$${(data.sharePrice || 0).toFixed(2)}`;
  document.getElementById("healthScore").innerText = data.healthScore || 100;
  document.getElementById("partnersCount").innerText = (data.partners && data.partners.length) || 0;

  // AUTO-DETERMINE VISA TYPE based on balance
  const visaType = determineVisaType(balance);
  document.getElementById("visaType").innerText = visaType;
  document.getElementById("visaTypeDisplay").innerText = visaType.split(" ")[1] || "Classic";

  // Update Earn Rate Display
  // Base 2.50 + (Level * 0.50)
  let rate = 2.50 + (data.level * 0.50);
  // Partnership bonus check
  if (data.partners && data.partners.length > 0) {
    rate = rate * (1 + (data.partners.length * 0.25));
  }
  document.getElementById("earnRate").innerText = rate.toFixed(2);
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
setInterval(loadData, 30000); // Refresh every 30 seconds
