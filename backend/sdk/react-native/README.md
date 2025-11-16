# React Native starter SDK (backend integration)

This small SDK provides convenience helpers for integrating a React Native app with the taxis backend in this repo. It includes:

- `api.js` — minimal REST client (login, register, requestRide, driver flows)
- `socket.js` — Socket.IO connection manager for realtime events
- `hooks/useRide.js` — example React hook to manage a ride's realtime state

Quick start

1. Install runtime dependencies in your React Native app:

```
npm install socket.io-client
```

2. Copy the SDK folder into your RN project (or import via a local package).

Usage example

Simple login + listen for matched ride:

```js
import api from './sdk/react-native/api';
import socket from './sdk/react-native/socket';

async function start() {
  const res = await api.login('client@test.com', 'client123');
  const token = res.data.token;
  api.setAuthToken(token);
  const s = socket.connect(token);

  s.on('ride:matched', (payload) => {
    console.log('ride matched', payload);
  });

  // Request a ride
  const r = await api.requestRide({ pickup:{lat:40.7,lng:-74.0}, dropoff:{lat:40.75,lng:-73.98} });
  console.log('requested', r);
}
```

Notes
- The backend base URL defaults to `http://localhost:5000`. Set `BACKEND_URL` in your environment (or replace the constant in the SDK) when running on device/emulator.
- This SDK is intentionally small and focuses on clarity. For production apps you should add retries, exponential backoff for socket reconnects, better error handling, types (TypeScript), and secure storage for tokens.

Next steps I can do for you

- Convert this SDK to TypeScript and add typings
- Publish as a local package or prepare a small NPM package
- Add example RN screens (map + request flow) wired to this SDK
