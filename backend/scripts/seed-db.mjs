import bcrypt from 'bcryptjs';
import sequelize from '../db/sequelize.js';
import User from '../sequelize_models/User.js';
import Ride from '../sequelize_models/Ride.js';

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
        isOnline: false,
        location: sequelize.fn('ST_GeomFromText', 'POINT(40.7128 -74.0060)'),
      });

      await User.create({
        role: 'client',
        name: 'Jane Client',
        email: 'client@test.com',
        passwordHash: hashedClientPass,
        isOnline: false,
        location: sequelize.fn('ST_GeomFromText', 'POINT(40.7580 -73.9855)'),
      });

      console.log('✅ Sample users created');
    } else {
      console.log('⚠️  Users already exist, skipping seed');
    }

    console.log('✅ Database seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
