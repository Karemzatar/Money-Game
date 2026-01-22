let company = null;
let companyId = new URLSearchParams(window.location.search).get("id");

// Check if company ID exists
if (!companyId) {
  console.log("No company ID provided");
  window.location.href = "/";
}

console.log("Loading company details for ID:", companyId);

// Load company data on page load
fetch(`/data/${companyId}`)
  .then(res => {
    console.log("Response status:", res.status);
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log("Company data loaded:", data);
    company = data;
    displayCompanyDetails();
  })
  .catch(err => {
    console.error("Error loading data:", err);
    console.error("Company ID was:", companyId);
    alert("Failed to load company data: " + err.message);
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  });

function displayCompanyDetails() {
  try {
    // Format card number (XXXX XXXX XXXX XXXX)
    const cardDisplay = company.cardNumber && company.cardNumber.length === 16 
      ? company.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
      : "0000 0000 0000 0000";

    // Update visa card
    document.getElementById("detailsCardNumber").innerText = cardDisplay;
    document.getElementById("detailsCompanyName").innerText = company.company || "N/A";

    // Update all info
    document.getElementById("detailsCompanyNameText").innerText = company.company || "N/A";
    document.getElementById("detailsManagerName").innerText = company.manager || "N/A";
    document.getElementById("detailsCardNumberText").innerText = cardDisplay;
    
    const balance = Number(company.balance) || 0;
    document.getElementById("detailsBalance").innerText = 
      `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Determine card status based on balance
    let cardStatus = "classic";
    let displayStatus = "Visa Classic";
    let statusColor = "purple";
    if (balance >= 5_000_000) {
      cardStatus = "infinite";
      displayStatus = "Visa Infinite";
      statusColor = "gold";
    } else if (balance >= 1_000_000) {
      cardStatus = "signature";
      displayStatus = "Visa Signature";
      statusColor = "darkblue";
    } else if (balance >= 500_000) {
      cardStatus = "platinum";
      displayStatus = "Visa Platinum";
      statusColor = "silver";
    } else if (balance >= 100_000) {
      cardStatus = "gold";
      displayStatus = "Visa Gold";
      statusColor = "orange";
    }

    const statusElement = document.getElementById("detailsCardStatus");
    statusElement.innerText = displayStatus;
    statusElement.style.color = statusColor;

    // Update visa card design based on status
    const visaCard = document.getElementById("detailsVisa");
    if (visaCard) {
      visaCard.className = "visa-card " + cardStatus.toLowerCase();
    }

    // Format and display creation date
    if (company.createdAt) {
      const createdDate = new Date(company.createdAt);
      const formattedDate = createdDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      document.getElementById("detailsCreatedDate").innerText = formattedDate;

      // Calculate account age
      const now = new Date();
      const ageMs = now - createdDate;
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      const ageHours = Math.floor((ageMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      let ageText = "";
      if (ageDays > 0) {
        ageText = `${ageDays} day${ageDays > 1 ? 's' : ''} ${ageHours} hour${ageHours !== 1 ? 's' : ''}`;
      } else {
        ageText = `${ageHours} hour${ageHours !== 1 ? 's' : ''}`;
      }
      document.getElementById("detailsAccountAge").innerText = ageText;
    }
  } catch (err) {
    console.error("Error displaying company details:", err);
  }
}

function deleteCompany() {
  const confirmed = confirm(
    `⚠️ Are you sure you want to delete "${company.company}"?\n\n` +
    `This action cannot be undone. All company data will be permanently removed.\n\n` +
    `Balance: $${Number(company.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );

  if (!confirmed) {
    console.log("Delete cancelled by user");
    return;
  }

  fetch(`/companies/${companyId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  })
    .then(res => {
      console.log("Delete response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("Company deleted successfully:", data);
      alert("Company deleted successfully! ✓");
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    })
    .catch(err => {
      console.error("Error deleting company:", err);
      alert("Failed to delete company: " + err.message);
    });
}
