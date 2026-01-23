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
  // Redirect to home page
  window.location.href = "home.html";
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

  const imageUrl = document.getElementById("imageUrl").value;

  fetch("/api/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, manager, imageUrl })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        errorDiv.innerText = data.error;
      } else if (data.id) {
        sessionStorage.setItem("companyId", data.id);

        // Show Netfactions Tutorial Video Modal
        const modal = document.createElement('div');
        modal.id = 'tutorialModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.95)';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        const title = document.createElement('h2');
        title.innerText = "Welcome to Netfactions!";
        title.style.color = '#4CAF50';
        title.style.marginBottom = '20px';
        title.style.fontFamily = 'Arial, sans-serif';

        const video = document.createElement('video');
        video.src = 'videos/tutorial.mp4';
        video.controls = true;
        video.autoplay = true;
        video.style.maxWidth = '90%';
        video.style.maxHeight = '70%';
        video.style.borderRadius = '10px';
        video.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';

        // Handle error if video missing
        video.onerror = function () {
          console.warn("Tutorial video not found.");
          title.innerText += " (Video Unavailable)";
        };

        const pinMsg = document.createElement('p');
        pinMsg.innerText = `Your Login PIN: ${data.pin}`;
        pinMsg.style.color = '#fff';
        pinMsg.style.fontSize = '18px';
        pinMsg.style.marginTop = '20px';
        pinMsg.style.fontWeight = 'bold';

        const closeBtn = document.createElement('button');
        closeBtn.innerText = "Continue to Home";
        closeBtn.className = "btn btn-primary";
        closeBtn.style.marginTop = '20px';
        closeBtn.style.padding = '10px 30px';
        closeBtn.onclick = function () {
          window.location.href = "home.html";
        };

        modal.appendChild(title);
        modal.appendChild(video);
        modal.appendChild(pinMsg);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);

        // Alert is redundant if we show it in modal, but let's keep it safe or remove it?
        // User saw "Alert user about their new PIN" comment. 
        // I'll skip the alert since I added the PIN to the modal.
      }
    })
    .catch(err => {
      errorDiv.innerText = "Failed to create company. Try again.";
      console.error(err);
    });
}
