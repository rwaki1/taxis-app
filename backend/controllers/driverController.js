const User = require('../models/User');
const Ride = require('../models/Ride');

// Go online
exports.goOnline = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const driver = await User.findByIdAndUpdate(
      req.user.userId,
      {
        isOnline: true,
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    );
    
    res.json({ message: 'Driver is now online', driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Go offline
exports.goOffline = async (req, res) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.user.userId,
      { isOnline: false },
      { new: true }
    );
    
    res.json({ message: 'Driver is now offline', driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update driver location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const driver = await User.findByIdAndUpdate(
      req.user.userId,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    );
    
    res.json({ message: 'Location updated', driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept ride request
exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      {
        driverId: req.user.userId,
        status: 'accepted'
      },
      { new: true }
    ).populate('clientId driverId');
    
    res.json({ message: 'Ride accepted', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get nearby available rides
exports.getNearbyRides = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000 } = req.query;
    
    const rides = await Ride.find({
      status: 'requested',
      pickupLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('clientId', 'name phone').limit(10);
    
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get driver active rides
exports.getActiveRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      driverId: req.user.userId,
      status: { $in: ['accepted', 'started'] }
    }).populate('clientId', 'name phone');
    
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start ride
exports.startRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { status: 'started', rideStartTime: new Date() },
      { new: true }
    );
    
    res.json({ message: 'Ride started', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete ride
exports.completeRide = async (req, res) => {
  try {
    const { rideId, fare } = req.body;
    
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      {
        status: 'completed',
        rideEndTime: new Date(),
        fare
      },
      { new: true }
    );
    
    res.json({ message: 'Ride completed', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
