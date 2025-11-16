import { Op } from 'sequelize';
import sequelize from '../db/sequelize.js';
import User from '../sequelize_models/User.js';
import Ride from '../sequelize_models/Ride.js';

const driverController = {
  // Update driver location
  async updateLocation(req, res) {
    try {
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude required' });
      }

      const driver = await User.findByPk(req.user.id);
      if (!driver || driver.role !== 'driver') {
        return res.status(403).json({ error: 'Only drivers can update location' });
      }

      // Update location using ST_GeomFromText (MySQL spatial)
      await driver.update({
        location: sequelize.literal(
          `ST_GeomFromText('POINT(${latitude} ${longitude})', 4326)`
        ),
      });

      res.json({ message: 'Location updated', location: driver.location });
    } catch (err) {
      console.error('Update location error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Go online/offline
  async setOnlineStatus(req, res) {
    try {
      const { isOnline } = req.body;
      const driver = await User.findByPk(req.user.id);
      if (!driver || driver.role !== 'driver') {
        return res.status(403).json({ error: 'Only drivers can change online status' });
      }

      await driver.update({ isOnline: Boolean(isOnline) });
      res.json({ message: `Driver ${isOnline ? 'online' : 'offline'}`, isOnline: driver.isOnline });
    } catch (err) {
      console.error('Set online status error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Get nearby clients requesting rides (using ST_Distance)
  async getNearbyRideRequests(req, res) {
    try {
      const driver = await User.findByPk(req.user.id);
      if (!driver || driver.role !== 'driver' || !driver.location) {
        return res.status(403).json({ error: 'Driver not online or location not set' });
      }

      // Find requested rides with clients within a certain radius (e.g., 5km)
      const rides = await Ride.findAll({
        where: {
          status: 'requested',
        },
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'name', 'email'],
          },
        ],
        raw: false,
        limit: 10,
      });

      // Filter by distance (simplified; ideally use ST_Distance in the query)
      const nearby = rides.filter(ride => {
        // This is a placeholder; in production, use ST_Distance in the WHERE clause
        return true; // Return all for now
      });

      res.json({ rides: nearby });
    } catch (err) {
      console.error('Get nearby requests error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Accept a ride request
  async acceptRide(req, res) {
    try {
      const { rideId } = req.body;
      const ride = await Ride.findByPk(rideId);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.status !== 'requested') {
        return res.status(400).json({ error: 'Ride is not in requested status' });
      }

      await ride.update({
        driverId: req.user.id,
        status: 'accepted',
      });

      res.json({ message: 'Ride accepted', ride });
    } catch (err) {
      console.error('Accept ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Start a ride (accepted -> in_progress)
  async startRide(req, res) {
    try {
      const { rideId } = req.body;
      const ride = await Ride.findByPk(rideId);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.driverId !== req.user.id) {
        return res.status(403).json({ error: 'You are not the assigned driver' });
      }

      if (ride.status !== 'accepted') {
        return res.status(400).json({ error: 'Ride is not accepted' });
      }

      await ride.update({ status: 'in_progress' });
      res.json({ message: 'Ride started', ride });
    } catch (err) {
      console.error('Start ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Complete a ride (in_progress -> completed)
  async completeRide(req, res) {
    try {
      const { rideId } = req.body;
      const ride = await Ride.findByPk(rideId);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.driverId !== req.user.id) {
        return res.status(403).json({ error: 'You are not the assigned driver' });
      }

      if (ride.status !== 'in_progress') {
        return res.status(400).json({ error: 'Ride is not in progress' });
      }

      await ride.update({ status: 'completed' });
      res.json({ message: 'Ride completed', ride });
    } catch (err) {
      console.error('Complete ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default driverController;
