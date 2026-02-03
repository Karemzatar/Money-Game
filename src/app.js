const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config/index.js'); // ✅ هذا السطر هو الحل

const app = express();
