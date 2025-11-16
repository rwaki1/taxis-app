# 🚕 TAXIS APP - Complete Development Guide

A full-stack real-time taxi application with driver matching, location tracking, and ride management.

## 📋 Features

### Driver App
- ✅ Go online/offline with real-time status
- ✅ View nearby ride requests
- ✅ Accept and manage rides
- ✅ Real-time location tracking
- ✅ Earnings dashboard
- ✅ Driver ratings and reviews

### Client App
- ✅ Request rides from current location
- ✅ See nearby available drivers
- ✅ Real-time driver tracking on map
- ✅ Ride history
- ✅ Rate and review drivers
- ✅ Payment integration

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB (NoSQL Database)
- Socket.IO (Real-time Communication)
- JWT (Authentication)
- Geospatial Queries (Location-based search)

**Frontend:**
- React Native (Driver App)
- React Native (Client App)
- Google Maps / Mapbox
- Redux (State Management)
- Socket.IO Client

---

## 📦 Project Structure

```
TAXIS_PROJECT/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (driver/client)
│   │   └── Ride.js          # Ride schema
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── driverController.js
│   │   └── rideController.js
│   ├── routes/
│   │   └── api.js           # API routes
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── server.js            # Main server file
│   ├── .env                 # Environment variables
│   └── package.json
├── frontend/
│   ├── driver-app/          # React Native Driver App
│   └── client-app/          # React Native Client App
├── test-api.js              # Automated API testing
├── TESTING_GUIDE.md
├── Postman_Collection.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14 or higher
- **MongoDB** (local or Atlas cloud)
- **npm** or **yarn**

### 1️⃣ Setup Backend

**Windows Users - Quick Method:**
```bash
# Double-click START_BACKEND.bat in the project folder
# Or run manually:
cd backend
npm install
npm run dev
```

**Mac/Linux Users:**
```bash
cd backend
npm install
npm run dev
```

### 2️⃣ Configure Environment

Create or edit `.env` file in the backend folder:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/taxis_app
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/taxis_app

# JWT Secret
JWT_SECRET=your_secret_key_change_this_to_something_long_and_random

# Server Port
PORT=5000

# Environment
NODE_ENV=development
```

### 3️⃣ Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows
mongod

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 4️⃣ Verify Backend is Running

Visit: http://localhost:5000

You should see:
```json
{ "message": "🎉 Taxis App Backend is Running!" }
```

---

## 🧪 Testing the API

### Option 1: Automated Testing (Recommended)

```bash
# Run all API tests automatically
node test-api.js
```

This will test:
- ✅ User registration (driver & client)
- ✅ User login
- ✅ Driver online/offline
- ✅ Ride requests
- ✅ Ride acceptance
- ✅ Location tracking
- ✅ Ride completion
- ✅ Ratings

### Option 2: Using Postman

1. **Import Postman Collection**
   - Open Postman
   - Click "Import"
   - Select `Postman_Collection.json`

2. **Set Variables**
   - In Postman, set environment variables:
     - `driver_token` - from driver login
     - `client_token` - from client login
     - `ride_id` - from ride request

3. **Run Requests in Order**
   - Register Driver
   - Register Client
   - Login both users
   - Driver goes online
   - Client requests ride
   - Driver accepts ride
   - etc.

### Option 3: Using cURL

```bash
# Register Driver
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Driver",
    "email": "driver@example.com",
    "phone": "1234567890",
    "password": "password123",
    "role": "driver",
    "licensePlate": "ABC-123",
    "vehicleType": "sedan",
    "carModel": "Toyota Camry"
  }'

# Login Driver
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "password123"
  }'

# Driver goes online
curl -X PUT http://localhost:5000/api/driver/online \
  -H "Authorization: Bearer <driver_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

---

## 📡 Real-time WebSocket Testing

### Using Socket.IO Client Library

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:5000');

// Driver sends location update
socket.emit('driver-location', {
  userId: 'driver_id',
  latitude: 40.7128,
  longitude: -74.0060
});

// Listen for driver location updates
socket.on('driver-location-updated', (data) => {
  console.log('Driver location:', data);
});

// Listen for new ride requests
socket.on('new-ride-request', (data) => {
  console.log('New ride:', data);
});
```

---

## 📚 API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |

### Driver
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/driver/online` | Go online with location |
| PUT | `/api/driver/offline` | Go offline |
| PUT | `/api/driver/location` | Update current location |
| GET | `/api/driver/nearby-rides` | Get nearby ride requests |
| POST | `/api/driver/accept-ride` | Accept a ride |
| GET | `/api/driver/active-rides` | Get active rides |
| POST | `/api/driver/start-ride` | Start a ride |
| POST | `/api/driver/complete-ride` | Complete a ride |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ride/request` | Request a ride |
| GET | `/api/ride/current` | Get current ride |
| GET | `/api/ride/client-rides` | Get all rides history |
| POST | `/api/ride/rate` | Rate a completed ride |
| POST | `/api/ride/cancel` | Cancel a ride |

---

## 🗺️ Complete Test Flow

Follow this sequence to test the entire app:

```
1. Register Driver
   ↓
2. Register Client
   ↓
3. Driver Login
   ↓
4. Client Login
   ↓
5. Driver Goes Online (with location)
   ↓
6. Client Requests Ride
   ↓
7. Driver Gets Nearby Rides
   ↓
8. Driver Accepts Ride
   ↓
9. Driver Starts Ride
   ↓
10. Client Gets Current Ride (sees driver)
   ↓
11. Driver Updates Location (real-time tracking)
   ↓
12. Driver Completes Ride
   ↓
13. Client Rates Ride
   ↓
14. Driver Goes Offline
```

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
```
Solution:
1. Ensure MongoDB is running (mongod command)
2. Check MONGODB_URI in .env
3. Verify connection string format
4. For Atlas, add your IP to whitelist
```

### "Port 5000 already in use"
```
Solution:
1. Change PORT in .env to 5001, 5002, etc.
2. Or kill the process using port 5000:
   - Windows: netstat -ano | findstr :5000
   - Mac/Linux: lsof -ti:5000 | xargs kill -9
```

### "JWT Token Invalid"
```
Solution:
1. Ensure token is in Authorization header
2. Format: Authorization: Bearer <token>
3. Check JWT_SECRET in .env is correct
4. Token expires after 7 days
```

### "CORS Error"
```
Solution:
CORS is already enabled. If still getting errors:
1. Check frontend origin
2. Verify server is running
3. Clear browser cache
```

---

## 📱 Building Frontend Apps (Next Steps)

### Driver App Stack
- React Native Expo
- React Navigation
- Geolocation API
- Google Maps
- Socket.IO Client

### Client App Stack
- React Native Expo
- React Navigation
- Geolocation API
- Google Maps
- Socket.IO Client
- Payment integration

---

## 🔐 Security Features

✅ **JWT Authentication** - Secure token-based auth
✅ **Password Hashing** - bcryptjs encryption
✅ **CORS Enabled** - Cross-origin requests
✅ **Environment Variables** - Secret management
✅ **Geospatial Indexing** - Efficient location queries

---

## 📈 Performance Optimization

✅ **MongoDB Indexing** - 2dsphere for location queries
✅ **WebSocket Real-time** - Socket.IO for low-latency updates
✅ **Geospatial Queries** - Fast nearest-driver search
✅ **JWT Tokens** - Stateless authentication

---

## 🚀 Deployment

### Deploy Backend to Heroku

```bash
# 1. Create Heroku app
heroku create your-app-name

# 2. Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret

# 3. Deploy
git push heroku main

# 4. View logs
heroku logs --tail
```

### Deploy Frontend

- **React Native**: Build APK/IPA for iOS/Android
- **Expo**: Use Expo Go for development, EAS for production

---

## 📞 Support & Contact

For issues or questions:
1. Check TESTING_GUIDE.md
2. Review API endpoints
3. Check browser console for errors
4. Verify MongoDB connection
5. Check JWT tokens in Authorization header

---

## 📄 License

MIT License - Feel free to use this project for educational and commercial purposes.

---

## 🎉 You're All Set!

Your Taxis App backend is ready for testing! 

**Quick Commands:**
```bash
# Start backend
cd backend && npm run dev

# Run tests
node test-api.js

# View in browser
http://localhost:5000
```

Happy coding! 🚕✨ — Local Docker Compose

Full documentation here.