const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');
const driverController = require('../controllers/driverController');
const rideController = require('../controllers/rideController');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/profile', auth, authController.getProfile);

// Driver routes
router.put('/driver/online', auth, driverController.goOnline);
router.put('/driver/offline', auth, driverController.goOffline);
router.put('/driver/location', auth, driverController.updateLocation);
router.post('/driver/accept-ride', auth, driverController.acceptRide);
router.get('/driver/nearby-rides', auth, driverController.getNearbyRides);
router.get('/driver/active-rides', auth, driverController.getActiveRides);
router.post('/driver/start-ride', auth, driverController.startRide);
router.post('/driver/complete-ride', auth, driverController.completeRide);

// Ride routes
router.post('/ride/request', auth, rideController.requestRide);
router.get('/ride/client-rides', auth, rideController.getClientRides);
router.get('/ride/current', auth, rideController.getCurrentRide);
router.post('/ride/rate', auth, rideController.rateRide);
router.post('/ride/cancel', auth, rideController.cancelRide);

module.exports = router;
