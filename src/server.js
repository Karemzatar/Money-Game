'use strict';

const app = require('./app');

// Railway يحدد البورت تلقائيًا
const PORT = process.env.PORT;

if (!PORT) {
  console.error('❌ PORT not provided by Railway');
  process.exit(1);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Money Game running on port ${PORT}`);
});
