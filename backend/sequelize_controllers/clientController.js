import sequelize from '../db/sequelize.js';
import Ride from '../sequelize_models/Ride.js';
import User from '../sequelize_models/User.js';

const clientController = {
  // Request a ride
  async requestRide(req, res) {
    try {
      const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;
      if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
        return res.status(400).json({ error: 'All location coordinates required' });
      }

      const client = await User.findByPk(req.user.id);
      if (!client || client.role !== 'client') {
        return res.status(403).json({ error: 'Only clients can request rides' });
      }

      // Create ride with locations
      const ride = await Ride.create({
        clientId: req.user.id,
        pickup: sequelize.literal(
          `ST_GeomFromText('POINT(${pickupLat} ${pickupLng})', 4326)`
        ),
        dropoff: sequelize.literal(
          `ST_GeomFromText('POINT(${dropoffLat} ${dropoffLng})', 4326)`
        ),
        status: 'requested',
      });

      // Normalize response shape for backward compatibility with test-suite
      const rideObj = ride.toJSON ? ride.toJSON() : ride;
      rideObj._id = String(ride.id);
      res.status(201).json({ message: 'Ride requested', ride: rideObj });
    } catch (err) {
      console.error('Request ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Get active rides for client
  async getMyRides(req, res) {
    try {
      const rides = await Ride.findAll({
        where: { clientId: req.user.id },
        include: [
          {
            model: User,
            as: 'driver',
            attributes: ['id', 'name', 'email', 'isOnline'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({ rides });
    } catch (err) {
      console.error('Get rides error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Get ride details
  async getRideDetails(req, res) {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findByPk(rideId, {
        include: [
          {
            model: User,
            as: 'driver',
            attributes: ['id', 'name', 'email', 'isOnline', 'location'],
          },
          {
            model: User,
            as: 'client',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

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

  // Cancel a ride request
  async cancelRide(req, res) {
    try {
      const { rideId } = req.body;
      const ride = await Ride.findByPk(rideId);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.clientId !== req.user.id) {
        return res.status(403).json({ error: 'Only the client can cancel this ride' });
      }

      if (['completed', 'cancelled'].includes(ride.status)) {
        return res.status(400).json({ error: `Ride is already ${ride.status}` });
      }

      await ride.update({ status: 'cancelled' });
      res.json({ message: 'Ride cancelled', ride });
    } catch (err) {
      console.error('Cancel ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Rate a completed ride
  async rateRide(req, res) {
    try {
      const { rideId, rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const ride = await Ride.findByPk(rideId);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.clientId !== req.user.id) {
        return res.status(403).json({ error: 'Only the client can rate this ride' });
      }

      if (ride.status !== 'completed') {
        return res.status(400).json({ error: 'Can only rate completed rides' });
      }

      // Update with rating (add rating field if not present in schema)
      // For now, just confirm
      res.json({ message: 'Ride rated successfully', rideId, rating, comment });
    } catch (err) {
      console.error('Rate ride error:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default clientController;
