const Ride = require('../models/Ride');
const User = require('../models/User');

// Request a ride
exports.requestRide = async (req, res) => {
  try {
    const {
      pickupAddress,
      pickupLatitude,
      pickupLongitude,
      dropoffAddress,
      dropoffLatitude,
      dropoffLongitude
    } = req.body;
    
    const ride = new Ride({
      clientId: req.user.userId,
      pickupLocation: {
        address: pickupAddress,
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(pickupLongitude), parseFloat(pickupLatitude)]
        }
      },
      dropoffLocation: {
        address: dropoffAddress,
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(dropoffLongitude), parseFloat(dropoffLatitude)]
        }
      }
    });
    
    await ride.save();
    res.status(201).json({ message: 'Ride requested', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active rides for client
exports.getClientRides = async (req, res) => {
  try {
    const rides = await Ride.find({ clientId: req.user.userId })
      .populate('driverId', 'name phone carModel vehicleType')
      .sort({ createdAt: -1 });
    
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current ride
exports.getCurrentRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      clientId: req.user.userId,
      status: { $in: ['requested', 'accepted', 'started'] }
    }).populate('driverId', 'name phone carModel vehicleType currentLocation');
    
    res.json({ ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rate and complete ride
exports.rateRide = async (req, res) => {
  try {
    const { rideId, rating, feedback } = req.body;
    
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      {
        rating,
        feedback
      },
      { new: true }
    );
    
    res.json({ message: 'Ride rated', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { status: 'cancelled' },
      { new: true }
    );
    
    res.json({ message: 'Ride cancelled', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
