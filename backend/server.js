import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './db/sequelize.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(cors());

// Import controllers and middleware
import authMiddleware from './sequelize_middleware/authMiddleware.js';
import authController from './sequelize_controllers/authController.js';
import driverController from './sequelize_controllers/driverController.js';
import clientController from './sequelize_controllers/clientController.js';
// Ensure Sequelize model associations exist so eager-loading works
import User from './sequelize_models/User.js';
import Ride from './sequelize_models/Ride.js';

// Define associations if not already defined
try {
  Ride.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
  Ride.belongsTo(User, { as: 'driver', foreignKey: 'driverId' });
  User.hasMany(Ride, { as: 'clientRides', foreignKey: 'clientId' });
  User.hasMany(Ride, { as: 'driverRides', foreignKey: 'driverId' });
} catch (e) {
  // ignore if associations already exist
}

// Auth routes
app.post('/auth/register', authController.validateRegister, authController.register);
app.post('/auth/login', authController.validateLogin, authController.login);
app.get('/auth/profile', authMiddleware.verifyToken, authController.getProfile);

// Driver routes
app.post('/driver/location', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.updateLocation);
app.post('/driver/online-status', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.setOnlineStatus);
app.get('/driver/nearby-requests', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.getNearbyRideRequests);
app.post('/driver/accept-ride', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.acceptRide);
app.post('/driver/start-ride', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.startRide);
app.post('/driver/complete-ride', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.completeRide);

// Client routes
app.post('/client/request-ride', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.requestRide);
app.get('/client/my-rides', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.getMyRides);
app.get('/client/ride/:rideId', authMiddleware.verifyToken, clientController.getRideDetails);
app.post('/client/cancel-ride', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.cancelRide);
app.post('/client/rate-ride', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.rateRide);

// Health check
app.get('/', (req, res) => res.json({ message: '🎉 Taxis App Backend (Sequelize + MySQL) is Running!' }));

// Compatibility endpoints to match test-suite expectations (aliases)
app.put('/driver/location', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.updateLocation);
app.put('/driver/online', authMiddleware.verifyToken, authMiddleware.verifyDriver, (req, res) => {
  const { latitude, longitude } = req.body || {};
  // try to reuse existing controller by adjusting payload
  if (latitude !== undefined && longitude !== undefined) {
    req.body.latitude = latitude;
    req.body.longitude = longitude;
  }
  // Mark driver online
  try {
    const driver = req.user; // middleware populates req.user
    // call setOnlineStatus handler logic via controller
    return driverController.setOnlineStatus(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
app.put('/driver/offline', authMiddleware.verifyToken, authMiddleware.verifyDriver, (req, res) => {
  // Mark driver offline
  try {
    req.body.isOnline = false;
    return driverController.setOnlineStatus(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Ride/client compatibility
app.post('/ride/request', authMiddleware.verifyToken, authMiddleware.verifyClient, (req, res, next) => {
  // normalize long-form coordinate keys to what clientController expects
  if (req.body.pickupLatitude !== undefined && req.body.pickupLongitude !== undefined) {
    req.body.pickupLat = req.body.pickupLat ?? req.body.pickupLatitude;
    req.body.pickupLng = req.body.pickupLng ?? req.body.pickupLongitude;
  }
  if (req.body.dropoffLatitude !== undefined && req.body.dropoffLongitude !== undefined) {
    req.body.dropoffLat = req.body.dropoffLat ?? req.body.dropoffLatitude;
    req.body.dropoffLng = req.body.dropoffLng ?? req.body.dropoffLongitude;
  }
  return clientController.requestRide(req, res, next);
});
app.get('/driver/nearby-rides', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.getNearbyRideRequests);
app.get('/ride/current', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.getCurrentRide ? clientController.getCurrentRide : clientController.getMyRides);
app.post('/ride/rate', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.rateRide);
app.get('/ride/client-rides', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.getMyRides);
app.get('/driver/active-rides', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.getActiveRides ? driverController.getActiveRides : driverController.getNearbyRideRequests);

// Compatibility shim: mirror existing routes under `/api/*` so clients/tests
// that expect the `/api` prefix work without changing route definitions.
if (app._router && Array.isArray(app._router.stack)) {
  app._router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const routePath = layer.route.path;
      const methods = Object.keys(layer.route.methods || {});
      methods.forEach((method) => {
        const handlers = layer.route.stack.map((s) => s.handle);
        try {
          app[method]('/api' + routePath, ...handlers);
        } catch (err) {
          console.warn('Could not mirror route', method, routePath, err && err.message);
        }
      });
    }
  });
}

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id);

  socket.on('driver-location', (data) => {
    socket.broadcast.emit('driver-location-updated', data);
  });

  socket.on('ride-requested', (data) => {
    socket.broadcast.emit('new-ride-request', data);
  });

  socket.on('ride-accepted', (data) => {
    socket.broadcast.emit('ride-accepted', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected:', socket.id);
  });
});

// Initialize database and start server
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize: MySQL connected');

    // Sync models (creates tables if not exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Sequelize: Models synced');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
})();
