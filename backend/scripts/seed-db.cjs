const bcrypt = require('bcryptjs');
const sequelize = require('../db/sequelize');
const User = require('../sequelize_models/User');
const Ride = require('../sequelize_models/Ride');

(async () => {
  try {
    // Authenticate and sync
    await sequelize.authenticate();
    console.log('✅ DB connection OK');

    // Sync models (creates tables if not exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Models synced');

    // Create sample users if none exist
    const userCount = await User.count();
    if (userCount === 0) {
      const hashedDriverPass = await bcrypt.hash('driver123', 10);
      const hashedClientPass = await bcrypt.hash('client123', 10);

      await User.create({
        role: 'driver',
        name: 'John Driver',
        email: 'driver@test.com',
        passwordHash: hashedDriverPass,
        isOnline: true,
        location: sequelize.where(
          sequelize.fn('ST_GeomFromText', 'POINT(40.7128 -74.0060)', 4326),
          sequelize.Op.eq,
          sequelize.fn('ST_GeomFromText', 'POINT(40.7128 -74.0060)', 4326)
        ),
      }).catch(err => console.warn('Driver seed skipped:', err.message));

      await User.create({
        role: 'client',
        name: 'Jane Client',
        email: 'client@test.com',
        passwordHash: hashedClientPass,
        isOnline: true,
      }).catch(err => console.warn('Client seed skipped:', err.message));

      console.log('✅ Sample users created');
    } else {
      console.log(`✅ ${userCount} users already exist, skipping seed`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
