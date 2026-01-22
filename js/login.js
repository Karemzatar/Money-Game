let companies = [];

// Load companies on page load
document.addEventListener("DOMContentLoaded", loadCompanies);


function loadCompanies() {
  fetch("/api/companies")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load companies");
      return res.json();
    })
    .then(data => {
      companies = Array.isArray(data) ? data : [];
      displayCompanies();
    })
    .catch(err => {
      console.error("Error loading companies:", err);
      companies = [];
      displayCompanies();
    });
}

function displayCompanies() {
  const companiesSection = document.getElementById("companiesSection");
  const companiesList = document.getElementById("companiesList");

  if (!Array.isArray(companies) || companies.length === 0) {
    companiesSection.style.display = "none";
    return;
  }

  companiesSection.style.display = "block";
  companiesList.innerHTML = "";

  companies.forEach(company => {
    const companyCard = document.createElement("div");
    companyCard.className = "company-card";
    const cardDisplay = company.cardNumber ?
      company.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ') :
      'No card';
    const trustedIcon = company.trusted ? ' ✅' : '';

    companyCard.innerHTML = `
      <div class="company-info">
        <h4>${company.company}${trustedIcon}</h4>
        <p>Manager: ${company.manager}</p>
        <p class="company-card-number">Card: <code>${cardDisplay}</code></p>
        <p class="company-balance">Balance: <strong>$${Number(company.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
      </div>
      <div class="company-card-buttons">
        <button type="button" class="btn btn-small-primary" onclick="selectCompany('${company.id}')">Login</button>
        <button type="button" class="btn btn-small-secondary" onclick="viewCompanyDetails('${company.id}')">Details</button>
      </div>
    `;
    companiesList.appendChild(companyCard);
  });
}

function selectCompany(id) {
  sessionStorage.setItem("companyId", id);
  // Redirect to secure wallet login where PIN is required
  window.location.href = "paybal-wallet.html";
}

function viewCompanyDetails(id) {
  window.location.href = `company-details.html?id=${id}`;
}

function toggleCreateForm() {
  const createForm = document.getElementById("createForm");
  const companiesSection = document.getElementById("companiesSection");

  if (createForm.style.display === "none") {
    createForm.style.display = "block";
    companiesSection.style.display = "none";
  } else {
    createForm.style.display = "none";
    companiesSection.style.display = "block";
  }
}

function login(event) {
  event.preventDefault();

  const company = document.getElementById("company").value.trim();
  const manager = document.getElementById("manager").value.trim();
  const errorDiv = document.getElementById("error");

  if (!company || !manager) {
    errorDiv.innerText = "Please fill in all fields";
    return;
  }

  // Admin Redirection
  if (company === 'admin' && manager === 'admin') {
    window.location.href = 'admin.html';
    return;
  }

  const visaType = document.getElementById("visaType").value;

  fetch("/api/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, manager, visaType })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        errorDiv.innerText = data.error;
      } else if (data.id) {
        sessionStorage.setItem("companyId", data.id);
        sessionStorage.setItem("companyId", data.id);
        // Alert user about their new PIN
        alert(`Company created! Your PIN is: ${data.pin}\n\nPlease save this PIN as it is required to login.`);
        window.location.href = "paybal-wallet.html";
      }
    })
    .catch(err => {
      errorDiv.innerText = "Failed to create company. Try again.";
      console.error(err);
    });
}
