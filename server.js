const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

// Increase payload limit just in case
app.use(express.json({ limit: '1mb' }));
app.use(express.static("public"));
app.get("/index.html", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
app.use("/css", express.static("css"));
app.use("/js", express.static("js"));

const companiesFile = "companies.json";
const logsFile = "logs.json";

// ===== Helper Functions =====

function getCompanies() {
  try {
    if (!fs.existsSync(companiesFile)) return [];
    const data = fs.readFileSync(companiesFile, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading companies:", err);
    return [];
  }
}

function saveCompanies(companies) {
  try {
    fs.writeFileSync(companiesFile, JSON.stringify(companies, null, 2));
  } catch (err) {
    console.error("Error saving companies:", err);
  }
}

function logAction(userId, action, extra = {}) {
  try {
    let logs = [];
    if (fs.existsSync(logsFile)) {
      logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
    }
    const log = { userId, action, timestamp: Date.now(), ...extra };
    logs.push(log);
    fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error("Error logging action:", err);
  }
}

function calculateSharePrice(company) {
  // Share price = (Assets * 0.0001) + (Level * 2)
  // If partners > 0, boost by 10% per partner
  let price = (company.balance * 0.00001) + (company.level * 2);
  if (price < 1) price = 1; // Minimum $1

  // Partnership bonus
  if (company.partners && company.partners.length > 0) {
    // 25% increase? The requirement says "Accepted partnerships ... Increase in share price".
    // Let's do a simple multiplier
    price = price * (1 + (company.partners.length * 0.25));
  }

  return parseFloat(price.toFixed(2));
}

function determineVisaType(balance) {
  if (balance >= 5000000) return "Visa Infinite";
  if (balance >= 1000000) return "Visa Signature";
  if (balance >= 500000) return "Visa Platinum";
  if (balance >= 100000) return "Visa Gold";
  return "Visa Classic";
}

function updateCompanyStats(company) {
  company.sharePrice = calculateSharePrice(company);
  company.visaType = determineVisaType(company.balance);
}

// ===== Routes =====

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

// GET /api/companies (Public list)
app.get("/api/companies", (req, res) => {
  const companies = getCompanies();
  // Return data for login screen (leaderboard/search style)
  const query = req.query.q ? req.query.q.toLowerCase() : null;

  let validCompanies = companies;
  if (query) {
    validCompanies = companies.filter(c => c.company.toLowerCase().includes(query));
  }

  const safeData = validCompanies.map(c => ({
    id: c.id,
    company: c.company,
    manager: c.manager,
    balance: c.balance,
    cardNumber: c.cardNumber,
    trusted: c.trusted,
    locked: c.locked,
    level: c.level || 0,
    sharePrice: c.sharePrice || 0,
    visaType: determineVisaType(c.balance),
    imageUrl: c.imageUrl
  }));
  res.json(safeData);
});

// GET /data/:id (Detailed Profile)
app.get("/data/:id", (req, res) => {
  const companies = getCompanies();
  const company = companies.find(c => c.id === req.params.id);
  if (!company) return res.status(404).json({ error: "Not found" });

  // Update dynamic stats on read
  updateCompanyStats(company);
  saveCompanies(companies);

  // Return safe info (full profile for owner or public profile?)
  // For now, returning mostly everything public needs plus balance (should be protected in real app but game logic allows view)
  res.json({
    id: company.id,
    company: company.company,
    manager: company.manager,
    balance: company.balance,
    cardNumber: company.cardNumber,
    healthScore: company.healthScore,
    trusted: company.trusted,
    locked: company.locked,
    level: company.level || 0,
    sharePrice: company.sharePrice || 0,
    partners: company.partners || [],
    partnershipRequests: company.partnershipRequests || [],
    visaType: determineVisaType(company.balance),
    imageUrl: company.imageUrl,
    createdAt: company.createdAt
  });
});

// POST /api/create (Create new company)
app.post("/api/create", (req, res) => {
  try {
    const { company, manager, imageUrl } = req.body;
    if (!company || !manager) return res.status(400).json({ error: "Missing fields" });

    const companies = getCompanies();

    // Generate random 16-digit card number
    const cardNumber = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");

    // Generate random 5-digit PIN
    const pin = Math.floor(10000 + Math.random() * 90000).toString();

    const newCompany = {
      id: Date.now().toString(),
      company,
      manager,
      balance: 0,
      cardNumber,
      createdAt: new Date().toISOString(),
      pin: pin,
      locked: false,
      healthScore: 100,
      favorites: [],
      trusted: false,
      level: 0,
      assets: 0,
      sharePrice: 1.00,
      partners: [],
      partnershipRequests: [],
      visaType: determineVisaType(0),
      imageUrl: req.body.imageUrl || null
    };

    companies.push(newCompany);
    saveCompanies(companies);

    logAction(newCompany.id, "company_created", { company, manager });

    res.json({ success: true, id: newCompany.id, pin: pin });
  } catch (err) {
    console.error("Error creating company:", err);
    res.status(500).json({ error: "Failed to create company" });
  }
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  try {
    const { loginId, pin } = req.body;
    const companies = getCompanies();

    const company = companies.find(c =>
      c.company.toLowerCase() === loginId.toLowerCase() ||
      c.cardNumber === loginId
    );

    if (!company) return res.status(404).json({ error: "Wallet not found" });

    if (company.pin !== pin) {
      logAction(company.id, "login_failed", { reason: "Invalid PIN" });
      company.healthScore = Math.max(0, (company.healthScore || 100) - 5);
      saveCompanies(companies);
      return res.status(401).json({ error: "Invalid PIN" });
    }

    if (company.locked) {
      logAction(company.id, "login_attempt_locked");
      return res.status(403).json({ error: "Wallet is locked/frozen. Contact Admin." });
    }

    logAction(company.id, "login_success");
    res.json(company);

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Error" });
  }
});

// POST /earn/:id (Money Button)
app.post("/earn/:id", (req, res) => {
  try {
    const companies = getCompanies();
    const company = companies.find(c => c.id === req.params.id);

    if (!company) return res.status(404).json({ error: "Company not found" });

    if (company.locked) return res.status(403).json({ error: "Account locked" });

    // Calculate Earnings
    // Base $2.50 + (level * 0.50)
    let amount = 2.50 + ((company.level || 0) * 0.50);

    // Partnership Bonus: +25% earnings per partner? "Accessed partnerships grant +25% earnings for both"
    // Assuming additive for multiple partners? Or just flat +25% if any? 
    // "Accepted partnerships grant +25% earnings" implies per partnership.
    if (company.partners && company.partners.length > 0) {
      const bonusMultiplier = 1 + (company.partners.length * 0.25);
      amount = amount * bonusMultiplier;
    }

    company.balance += amount;

    // Auto-level up based on balance
    // Level progression: Every $10,000 = 1 level (max 100)
    const oldLevel = company.level || 0;
    let calculatedLevel = Math.min(100, Math.floor(company.balance / 10000));

    // Apply level maintenance cost if leveling up
    if (calculatedLevel > oldLevel) {
      const levelCost = calculatedLevel * 100;
      company.balance -= levelCost;
      company.level = calculatedLevel;
    }

    // Re-check level after cost deduction (don't let cost cause level decrease)
    const finalLevel = Math.min(100, Math.floor(company.balance / 10000));
    if (finalLevel >= company.level) {
      company.level = finalLevel;
    }

    updateCompanyStats(company);
    saveCompanies(companies);

    res.json({ balance: company.balance, level: company.level, sharePrice: company.sharePrice });
  } catch (err) {
    console.error("Error earning money:", err);
    res.status(500).json({ error: "Failed to earn money" });
  }
});

// POST /api/transfer
app.post("/api/transfer", (req, res) => {
  try {
    const { senderId, recipientId, amount } = req.body;
    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const companies = getCompanies();
    const sender = companies.find(c => c.id === senderId);
    const recipient = companies.find(c => c.id === recipientId || c.cardNumber === recipientId || c.company.toLowerCase() === recipientId.toLowerCase());

    if (!sender) return res.status(404).json({ error: "Sender not found" });
    if (!recipient) return res.status(404).json({ error: "Recipient not found" });
    if (sender.locked) return res.status(403).json({ error: "Sender wallet is locked" });

    if (sender.balance < transferAmount) return res.status(400).json({ error: "Insufficient funds" });

    sender.balance -= transferAmount;
    recipient.balance += transferAmount;

    // Auto-level up for both sender and recipient based on their balances
    const senderOldLevel = sender.level || 0;
    const recipientOldLevel = recipient.level || 0;

    let senderNewLevel = Math.min(100, Math.floor(sender.balance / 10000));
    let recipientNewLevel = Math.min(100, Math.floor(recipient.balance / 10000));

    // Apply level maintenance cost if leveling up
    if (senderNewLevel > senderOldLevel) {
      const senderLevelCost = senderNewLevel * 100;
      sender.balance -= senderLevelCost;
    }

    if (recipientNewLevel > recipientOldLevel) {
      const recipientLevelCost = recipientNewLevel * 100;
      recipient.balance -= recipientLevelCost;
    }

    // Re-check levels after cost deduction
    senderNewLevel = Math.min(100, Math.floor(sender.balance / 10000));
    recipientNewLevel = Math.min(100, Math.floor(recipient.balance / 10000));

    sender.level = senderNewLevel;
    recipient.level = recipientNewLevel;

    updateCompanyStats(sender);
    updateCompanyStats(recipient);

    logAction(sender.id, "transfer_sent", { amount: transferAmount, to: recipient.company });

    saveCompanies(companies);
    res.json({ success: true, newBalance: sender.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transfer failed" });
  }
});

// PARTNERSHIP ROUTES

// Request Partnership
app.post("/api/partners/request", (req, res) => {
  const { requesterId, targetCompanyId } = req.body;
  const companies = getCompanies();
  const requester = companies.find(c => c.id === requesterId);
  const target = companies.find(c => c.id === targetCompanyId);

  if (!requester || !target) return res.status(404).json({ error: "Company not found" });
  if (requester.id === target.id) return res.status(400).json({ error: "Cannot partner with yourself" });

  if (!target.partnershipRequests) target.partnershipRequests = [];

  // Check if already partners
  if (requester.partners && requester.partners.includes(target.id)) {
    return res.status(400).json({ error: "Already partners" });
  }

  // Check if already requested
  if (target.partnershipRequests.find(r => r.fromId === requesterId)) {
    return res.status(400).json({ error: "Request already sent" });
  }

  target.partnershipRequests.push({
    fromId: requester.id,
    fromName: requester.company,
    timestamp: Date.now()
  });

  saveCompanies(companies);
  res.json({ success: true, message: "Partnership request sent" });
});

// Accept Partnership
app.post("/api/partners/accept", (req, res) => {
  const { acceptorId, requesterId } = req.body;
  const companies = getCompanies();
  const acceptor = companies.find(c => c.id === acceptorId);
  const requester = companies.find(c => c.id === requesterId);

  if (!acceptor || !requester) return res.status(404).json({ error: "Company not found" });

  // Remove request
  if (acceptor.partnershipRequests) {
    acceptor.partnershipRequests = acceptor.partnershipRequests.filter(r => r.fromId !== requesterId);
  }

  // Add to partners list for BOTH
  if (!acceptor.partners) acceptor.partners = [];
  if (!requester.partners) requester.partners = [];

  if (!acceptor.partners.includes(requesterId)) acceptor.partners.push(requesterId);
  if (!requester.partners.includes(acceptorId)) requester.partners.push(acceptorId);

  updateCompanyStats(acceptor);
  updateCompanyStats(requester);

  saveCompanies(companies);
  res.json({ success: true, message: "Partnership accepted" });
});

// Freeze Account (Toggle)
app.post("/api/account/freeze", (req, res) => {
  const { companyId, locked } = req.body;
  const companies = getCompanies();
  const company = companies.find(c => c.id === companyId);

  if (!company) return res.status(404).json({ error: "Company not found" });

  company.locked = locked;
  saveCompanies(companies);

  res.json({ success: true, locked: company.locked });
});


// ADMIN ROUTES
app.get("/api/admin/data", (req, res) => {
  const companies = getCompanies();
  let logs = [];
  if (fs.existsSync(logsFile)) logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));

  // Enhance company data for admin
  const enhanced = companies.map(c => {
    updateCompanyStats(c); // ensure stats are fresh in display
    return c;
  });

  res.json({ companies: enhanced, logs });
});

app.post("/api/admin/lock", (req, res) => {
  const { targetId, locked } = req.body;
  const companies = getCompanies();
  const target = companies.find(c => c.id === targetId);
  if (!target) return res.status(404).json({ error: "Target not found" });
  target.locked = locked;
  saveCompanies(companies);
  res.json({ success: true, locked: target.locked });
});

// DELETE /companies/:id (Delete company)
app.delete("/companies/:id", (req, res) => {
  try {
    const companies = getCompanies();
    const companyIndex = companies.findIndex(c => c.id === req.params.id);

    if (companyIndex === -1) return res.status(404).json({ error: "Company not found" });

    const deletedCompany = companies.splice(companyIndex, 1)[0];
    saveCompanies(companies);

    logAction(deletedCompany.id, "company_deleted", { company: deletedCompany.company });

    res.json({ success: true, message: "Company deleted" });
  } catch (err) {
    console.error("Error deleting company:", err);
    res.status(500).json({ error: "Failed to delete company" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

