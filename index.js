const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load data files
const companiesFile = path.join(__dirname, "companies.json");
const logsFile = path.join(__dirname, "logs.json");

function getCompanies() {
  try {
    return JSON.parse(fs.readFileSync(companiesFile, "utf8"));
  } catch {
    return [];
  }
}

function saveCompanies(companies) {
  fs.writeFileSync(companiesFile, JSON.stringify(companies, null, 2));
}

function logAction(userId, action, extra = {}) {
  let logs = [];
  if (fs.existsSync(logsFile)) logs = JSON.parse(fs.readFileSync(logsFile, "utf8"));
  const log = { userId, action, timestamp: Date.now(), ...extra };
  logs.push(log);
  fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
}

// --------------------- Commands ---------------------
const commands = [
  // ADMIN COMMANDS
  new SlashCommandBuilder().setName("check-account").setDescription("Check a company account").addStringOption(o => o.setName("company").setDescription("Company name").setRequired(true)),
  new SlashCommandBuilder().setName("frezze-company").setDescription("Freeze a company").addStringOption(o => o.setName("company").setDescription("Company name").setRequired(true)),
  new SlashCommandBuilder().setName("unfrezze-company").setDescription("Unfreeze a company").addStringOption(o => o.setName("company").setDescription("Company name").setRequired(true)),
  new SlashCommandBuilder().setName("ban").setDescription("Ban a user").addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true)),
  new SlashCommandBuilder().setName("unban").setDescription("Unban a user").addUserOption(o => o.setName("user").setDescription("User to unban").setRequired(true)),
  new SlashCommandBuilder().setName("timeout").setDescription("Timeout a user").addUserOption(o => o.setName("user").setDescription("User").setRequired(true)).addIntegerOption(o => o.setName("seconds").setDescription("Timeout duration in seconds").setRequired(true)),
  new SlashCommandBuilder().setName("untimeout").setDescription("Remove timeout").addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("mute").setDescription("Mute a user").addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("unmute").setDescription("Unmute a user").addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  new SlashCommandBuilder().setName("kick").setDescription("Kick a user").addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),
  // MEMBER COMMANDS
  new SlashCommandBuilder().setName("profile").setDescription("View a company profile").addStringOption(o => o.setName("company").setDescription("Company name").setRequired(true)),
  new SlashCommandBuilder().setName("company-registration").setDescription("Register a company").addStringOption(o => o.setName("company").setDescription("Company name").setRequired(true)).addStringOption(o => o.setName("pin").setDescription("PIN").setRequired(true)),
  new SlashCommandBuilder().setName("my-companies").setDescription("List your companies"),
  new SlashCommandBuilder().setName("company-logs").setDescription("View logs for a company").addStringOption(o => o.setName("company").setDescription("Company name").setRequired(true)),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Show top companies by balance")
].map(cmd => cmd.toJSON());

// Register commands
const rest = new REST({ version: '10' }).setToken(config.token);
(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

// --------------------- Command Handling ---------------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const member = interaction.member;
  const adminRole = config.adminRole;

  // Check admin
  const isAdmin = member.roles.cache.some(r => r.name === adminRole);

  // --------------------- ADMIN COMMANDS ---------------------
  if (commandName === "check-account") {
    if (!isAdmin) return interaction.reply({ content: "You are not an admin.", ephemeral: true });
    const companyName = interaction.options.getString("company");
    const company = getCompanies().find(c => c.company.toLowerCase() === companyName.toLowerCase());
    if (!company) return interaction.reply({ content: "Company not found.", ephemeral: true });
    interaction.reply({ content: `**${company.company}**\nManager: ${company.manager}\nBalance: ${company.balance}\nLocked: ${company.locked}\nLevel: ${company.level}\nShare Price: ${company.sharePrice}` });
  }

  if (commandName === "frezze-company") {
    if (!isAdmin) return interaction.reply({ content: "You are not an admin.", ephemeral: true });
    const companyName = interaction.options.getString("company");
    const companies = getCompanies();
    const company = companies.find(c => c.company.toLowerCase() === companyName.toLowerCase());
    if (!company) return interaction.reply({ content: "Company not found.", ephemeral: true });
    company.locked = true;
    saveCompanies(companies);
    logAction(company.id, "wallet_frozen_by_admin");
    interaction.reply({ content: `Company **${company.company}** is now frozen.` });
  }

  if (commandName === "unfrezze-company") {
    if (!isAdmin) return interaction.reply({ content: "You are not an admin.", ephemeral: true });
    const companyName = interaction.options.getString("company");
    const companies = getCompanies();
    const company = companies.find(c => c.company.toLowerCase() === companyName.toLowerCase());
    if (!company) return interaction.reply({ content: "Company not found.", ephemeral: true });
    company.locked = false;
    saveCompanies(companies);
    logAction(company.id, "wallet_unfrozen_by_admin");
    interaction.reply({ content: `Company **${company.company}** is now unfrozen.` });
  }

  // --------------------- MEMBER COMMANDS ---------------------
  if (commandName === "profile") {
    const companyName = interaction.options.getString("company");
    const company = getCompanies().find(c => c.company.toLowerCase() === companyName.toLowerCase());
    if (!company) return interaction.reply({ content: "Company not found.", ephemeral: true });
    interaction.reply({ content: `**${company.company}**\nManager: ${company.manager}\nBalance: ${company.balance}\nLevel: ${company.level}\nShare Price: ${company.sharePrice}` });
  }

  if (commandName === "company-registration") {
    const companyName = interaction.options.getString("company");
    const pin = interaction.options.getString("pin");

    const companies = getCompanies();
    if (companies.find(c => c.company.toLowerCase() === companyName.toLowerCase())) {
      return interaction.reply({ content: "Company already exists.", ephemeral: true });
    }

    const id = Date.now().toString();
    const cardNumber = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("");
    const newCompany = {
      id,
      company: companyName,
      manager: interaction.user.username,
      balance: 0,
      cardNumber,
      createdAt: new Date().toISOString(),
      pin,
      locked: false,
      healthScore: 100,
      favorites: [],
      trusted: false,
      level: 0,
      assets: 0,
      sharePrice: 1.00,
      partners: [],
      partnershipRequests: [],
      visaType: "Basic"
    };
    companies.push(newCompany);
    saveCompanies(companies);
    logAction(id, "company_created", { company: companyName, manager: interaction.user.username });
    interaction.reply({ content: `Company **${companyName}** registered successfully!` });
  }

  if (commandName === "my-companies") {
    const companies = getCompanies().filter(c => c.manager === interaction.user.username);
    if (!companies.length) return interaction.reply({ content: "You have no companies.", ephemeral: true });
    const list = companies.map(c => `**${c.company}** | Balance: ${c.balance} | Level: ${c.level}`).join("\n");
    interaction.reply({ content: list });
  }

  if (commandName === "company-logs") {
    const companyName = interaction.options.getString("company");
    const companies = getCompanies();
    const company = companies.find(c => c.company.toLowerCase() === companyName.toLowerCase());
    if (!company) return interaction.reply({ content: "Company not found.", ephemeral: true });
    const logs = JSON.parse(fs.readFileSync(logsFile, "utf8")).filter(l => l.userId === company.id);
    if (!logs.length) return interaction.reply({ content: "No logs found.", ephemeral: true });
    const logList = logs.map(l => `${new Date(l.timestamp).toLocaleString()} - ${l.action}${l.reason ? ` - ${l.reason}` : ""}`).join("\n");
    interaction.reply({ content: `Logs for **${company.company}**:\n${logList}` });
  }

  if (commandName === "leaderboard") {
    const companies = getCompanies().sort((a,b) => b.balance - a.balance).slice(0,10);
    const board = companies.map((c,i) => `${i+1}. **${c.company}** - $${c.balance}`).join("\n");
    interaction.reply({ content: `🏆 Top Companies:\n${board}` });
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(config.token);
