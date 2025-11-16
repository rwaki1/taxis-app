require('dotenv').config();
const sequelize = require('../db/sequelize');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize: connection OK');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sequelize: connection failed');
    console.error(err.message || err);
    process.exit(1);
  }
})();
