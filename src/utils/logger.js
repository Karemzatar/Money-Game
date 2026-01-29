const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'app.log');

/**
 * Log to file
 */
function logToFile(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    try {
        fs.appendFileSync(logFilePath, logEntry, 'utf8');
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

/**
 * Log info
 */
function info(message) {
    console.log(`[INFO] ${message}`);
    logToFile(message, 'INFO');
}

/**
 * Log warning
 */
function warn(message) {
    console.warn(`[WARN] ${message}`);
    logToFile(message, 'WARN');
}

/**
 * Log error
 */
function error(message, err = null) {
    console.error(`[ERROR] ${message}`, err || '');
    logToFile(`${message} ${err ? err.message : ''}`, 'ERROR');
}

/**
 * Log debug
 */
function debug(message) {
    if (process.env.DEBUG) {
        console.log(`[DEBUG] ${message}`);
        logToFile(message, 'DEBUG');
    }
}

module.exports = {
    info,
    warn,
    error,
    debug,
    logToFile,
};
