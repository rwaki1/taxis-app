/**
 * Standalone Test Server with In-Memory Mock Database
 * 
 * This server runs without needing a real MySQL instance.
 * Perfect for testing API logic and running the test suite.
 * 
 * Usage: node server-test.js
 * 
 * Then in another terminal: node test-api.js
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(cors());

// ============= IN-MEMORY DATA STORE =============

const users = new Map();
const rides = new Map();
let userIdCounter = 1;
let rideIdCounter = 1;

// ============= MIDDLEWARE =============

const authMiddleware = {
  verifyToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  },

  verifyDriver: (req, res, next) => {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'This endpoint is only for drivers' });
    }
    next();
  },

  verifyClient: (req, res, next) => {
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'This endpoint is only for clients' });
    }
    next();
  },
};

// ============= AUTH CONTROLLER =============

const authController = {
  validateRegister: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim(),
    body('role').isIn(['driver', 'client']),
  ],

  validateLogin: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],

  async register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role } = req.body;

    try {
      let user = Array.from(users.values()).find(u => u.email === email);
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = userIdCounter++;

      user = { id, email, passwordHash: hashedPassword, name, role, isOnline: false };
      users.set(id, user);

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = Array.from(users.values()).find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async getProfile(req, res) {
    try {
      const user = users.get(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isOnline: user.isOnline,
      });
    } catch (err) {
      console.error('Get profile error:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

// ============= DRIVER CONTROLLER =============

const driverController = {
  async updateLocation(req, res) {
    try {
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude required' });
      }

      const driver = users.get(req.user.id);
      if (!driver || driver.role !== 'driver') {
        return res.status(403).json({ error: 'Only drivers can update location' });
      }

      driver.location = { latitude, longitude };
      res.json({ message: 'Location updated', location: driver.location });
    } catch (err) {
      console.error('Update location error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async setOnlineStatus(req, res) {
    try {
      const { isOnline } = req.body;
      const driver = users.get(req.user.id);
      if (!driver || driver.role !== 'driver') {
        return res.status(403).json({ error: 'Only drivers can change online status' });
      }

      driver.isOnline = Boolean(isOnline);
      res.json({ message: `Driver ${isOnline ? 'online' : 'offline'}`, isOnline: driver.isOnline });
    } catch (err) {
      console.error('Set online status error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async getNearbyRideRequests(req, res) {
    try {
      const driver = users.get(req.user.id);
      if (!driver || driver.role !== 'driver') {
        return res.status(403).json({ error: 'Driver not found' });
      }

      const requestedRides = Array.from(rides.values()).filter(r => r.status === 'requested');
      res.json({ rides: requestedRides });
    } catch (err) {
      console.error('Get nearby requests error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async acceptRide(req, res) {
    try {
  const { rideId } = req.body;
  const ride = rides.get(parseInt(rideId));
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.status !== 'requested') {
        return res.status(400).json({ error: 'Ride is not in requested status' });
      }

      ride.driverId = req.user.id;
      ride.status = 'accepted';
      res.json({ message: 'Ride accepted', ride });
    } catch (err) {
      console.error('Accept ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async startRide(req, res) {
    try {
  const { rideId } = req.body;
  const ride = rides.get(parseInt(rideId));
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.driverId !== req.user.id) {
        return res.status(403).json({ error: 'You are not the assigned driver' });
      }

      if (ride.status !== 'accepted') {
        return res.status(400).json({ error: 'Ride is not accepted' });
      }

      ride.status = 'in_progress';
      res.json({ message: 'Ride started', ride });
    } catch (err) {
      console.error('Start ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async completeRide(req, res) {
    try {
  const { rideId } = req.body;
  const ride = rides.get(parseInt(rideId));
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.driverId !== req.user.id) {
        return res.status(403).json({ error: 'You are not the assigned driver' });
      }

      if (ride.status !== 'in_progress') {
        return res.status(400).json({ error: 'Ride is not in progress' });
      }

      ride.status = 'completed';
      res.json({ message: 'Ride completed', ride });
    } catch (err) {
      console.error('Complete ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

// ============= CLIENT CONTROLLER =============

const clientController = {
  async requestRide(req, res) {
    try {
      // Accept either shorthand (pickupLat/pickupLng) or long-form (pickupLatitude/pickupLongitude)
      const pickupLat = req.body.pickupLat ?? req.body.pickupLatitude ?? req.body.pickupLatitude;
      const pickupLng = req.body.pickupLng ?? req.body.pickupLongitude ?? req.body.pickupLongitude;
      const dropoffLat = req.body.dropoffLat ?? req.body.dropoffLatitude ?? req.body.dropoffLatitude;
      const dropoffLng = req.body.dropoffLng ?? req.body.dropoffLongitude ?? req.body.dropoffLongitude;

      if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
        return res.status(400).json({ error: 'All location coordinates required' });
      }

      const client = users.get(req.user.id);
      if (!client || client.role !== 'client') {
        return res.status(403).json({ error: 'Only clients can request rides' });
      }

      const id = rideIdCounter++;
      const ride = {
        id,
        clientId: req.user.id,
        driverId: null,
        pickup: { latitude: pickupLat, longitude: pickupLng },
        dropoff: { latitude: dropoffLat, longitude: dropoffLng },
        status: 'requested',
        fare: null,
      };
      // Provide both `id` and `_id` to mimic database-generated IDs used by tests
      ride._id = String(id);
      rides.set(id, ride);

      res.status(201).json({ message: 'Ride requested', ride });
    } catch (err) {
      console.error('Request ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async getMyRides(req, res) {
    try {
      const myRides = Array.from(rides.values()).filter(r => r.clientId === req.user.id);
      res.json({ rides: myRides });
    } catch (err) {
      console.error('Get rides error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async getRideDetails(req, res) {
    try {
      const { rideId } = req.params;
      const ride = rides.get(parseInt(rideId));
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.clientId !== req.user.id && ride.driverId !== req.user.id) {
        return res.status(403).json({ error: 'You do not have access to this ride' });
      }

      res.json({ ride });
    } catch (err) {
      console.error('Get ride details error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async cancelRide(req, res) {
    try {
      const { rideId } = req.body;
      const ride = rides.get(parseInt(rideId));
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.clientId !== req.user.id) {
        return res.status(403).json({ error: 'Only the client can cancel this ride' });
      }

      if (['completed', 'cancelled'].includes(ride.status)) {
        return res.status(400).json({ error: `Ride is already ${ride.status}` });
      }

      ride.status = 'cancelled';
      res.json({ message: 'Ride cancelled', ride });
    } catch (err) {
      console.error('Cancel ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async rateRide(req, res) {
    try {
      const { rideId, rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

  const ride = rides.get(parseInt(rideId));
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.clientId !== req.user.id) {
        return res.status(403).json({ error: 'Only the client can rate this ride' });
      }

      if (ride.status !== 'completed') {
        return res.status(400).json({ error: 'Can only rate completed rides' });
      }

      res.json({ message: 'Ride rated successfully', rideId, rating, comment });
    } catch (err) {
      console.error('Rate ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

// ============= ROUTES =============

app.post('/auth/register', authController.validateRegister, authController.register);
app.post('/auth/login', authController.validateLogin, authController.login);
app.get('/auth/profile', authMiddleware.verifyToken, authController.getProfile);

app.post('/driver/location', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.updateLocation);
app.post('/driver/online-status', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.setOnlineStatus);
app.get('/driver/nearby-requests', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.getNearbyRideRequests);
app.post('/driver/accept-ride', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.acceptRide);
app.post('/driver/start-ride', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.startRide);
app.post('/driver/complete-ride', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.completeRide);

// Compatibility routes for test suite (accept PUT and /online, /offline paths)
app.put('/driver/location', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.updateLocation);
app.put('/driver/online', authMiddleware.verifyToken, authMiddleware.verifyDriver, (req, res) => {
  // Accept latitude/longitude payload and mark driver online
  const { latitude, longitude } = req.body || {};
  const driver = users.get(req.user.id);
  if (!driver || driver.role !== 'driver') return res.status(403).json({ error: 'Only drivers can change online status' });
  if (latitude && longitude) driver.location = { latitude, longitude };
  driver.isOnline = true;
  res.json({ message: 'Driver online', isOnline: true, location: driver.location });
});
app.put('/driver/offline', authMiddleware.verifyToken, authMiddleware.verifyDriver, (req, res) => {
  const driver = users.get(req.user.id);
  if (!driver || driver.role !== 'driver') return res.status(403).json({ error: 'Only drivers can change online status' });
  driver.isOnline = false;
  res.json({ message: 'Driver offline', isOnline: false });
});

// Compatibility endpoints to match the test-suite's expected paths (/api/ride/* and variants)
app.post('/ride/request', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.requestRide);
app.get('/driver/nearby-rides', authMiddleware.verifyToken, authMiddleware.verifyDriver, driverController.getNearbyRideRequests);

// Return the client's current active ride (accepted or in_progress)
app.get('/ride/current', authMiddleware.verifyToken, authMiddleware.verifyClient, (req, res) => {
  const clientId = req.user.id;
  const active = Array.from(rides.values()).find(r => r.clientId === clientId && (r.status === 'accepted' || r.status === 'in_progress'));
  if (!active) return res.status(404).json({ error: 'No active ride' });
  res.json({ ride: active });
});

app.post('/ride/rate', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.rateRide);
app.get('/ride/client-rides', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.getMyRides);

app.get('/driver/active-rides', authMiddleware.verifyToken, authMiddleware.verifyDriver, (req, res) => {
  const driverId = req.user.id;
  const active = Array.from(rides.values()).filter(r => r.driverId === driverId && (r.status === 'accepted' || r.status === 'in_progress'));
  res.json({ rides: active });
});

app.post('/client/request-ride', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.requestRide);
app.get('/client/my-rides', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.getMyRides);
app.get('/client/ride/:rideId', authMiddleware.verifyToken, clientController.getRideDetails);
app.post('/client/cancel-ride', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.cancelRide);
app.post('/client/rate-ride', authMiddleware.verifyToken, authMiddleware.verifyClient, clientController.rateRide);

app.get('/', (req, res) => res.json({
  message: '🎉 Taxis App Backend is Running (Test Mode)',
  database: 'In-Memory Mock',
  note: 'This is a test server. For production, use server.js with a real MySQL database.',
}));

// Mirror all defined routes under `/api` so the test suite which hits
// `/api/...` endpoints works against this in-memory server as well.
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

// Socket.IO
io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id);
  socket.on('driver-location', (data) => socket.broadcast.emit('driver-location-updated', data));
  socket.on('ride-requested', (data) => socket.broadcast.emit('new-ride-request', data));
  socket.on('ride-accepted', (data) => socket.broadcast.emit('ride-accepted', data));
  socket.on('disconnect', () => console.log('🔴 Socket disconnected:', socket.id));
});

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log('📝 Using in-memory mock database (no MySQL required)');
  console.log(`📖 Run: node test-api.js  (in another terminal)`);
});
