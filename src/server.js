'use strict';

const app = require('./app');
const config = require('./config');

// Railway provides PORT automatically, config has fallback for local dev
const PORT = config.PORT || process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Money Game running on port ${PORT}`);
  console.log(`📍 Environment: ${config.NODE_ENV}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
