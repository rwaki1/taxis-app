// Minimal Socket.IO manager for React Native
// Requires: socket.io-client

import { io } from 'socket.io-client';

let socket = null;
const DEFAULT_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export function connect(token, opts = {}) {
  if (socket && socket.connected) return socket;
  socket = io(DEFAULT_URL, Object.assign({ auth: { token } }, opts));
  socket.on('connect_error', (err) => console.warn('Socket connect_error', err.message));
  return socket;
}

export function disconnect() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function on(event, cb) {
  if (!socket) return;
  socket.on(event, cb);
}

export function off(event, cb) {
  if (!socket) return;
  socket.off(event, cb);
}

export function emit(event, payload, cb) {
  if (!socket) return;
  socket.emit(event, payload, cb);
}

export function joinRideRoom(rideId) {
  if (!socket) return;
  socket.emit('ride:join', { rideId });
}

export function leaveRideRoom(rideId) {
  if (!socket) return;
  socket.emit('ride:leave', { rideId });
}

export default { connect, disconnect, on, off, emit, joinRideRoom, leaveRideRoom };
