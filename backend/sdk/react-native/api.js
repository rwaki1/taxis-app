// Minimal REST client for the taxis backend (React Native friendly)
// Uses fetch; setAuthToken must be called after login to attach JWT to requests.

let authToken = null;
const API_BASE = process.env.BACKEND_URL || 'http://localhost:5000';

export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${path}`, Object.assign({ headers }, options));
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
  if (!res.ok) {
    const err = new Error(body && body.error ? body.error.message : `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// Auth
export async function login(email, password) {
  const r = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (r && r.data && r.data.token) setAuthToken(r.data.token);
  return r;
}

export async function register(payload) {
  const r = await request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  if (r && r.data && r.data.token) setAuthToken(r.data.token);
  return r;
}

export async function getProfile() {
  return request('/auth/profile');
}

// Rider flows
export async function requestRide({ pickup, dropoff, notes, paymentMethodId, preferredDriverId }) {
  return request('/ride/request', {
    method: 'POST',
    body: JSON.stringify({ pickup, dropoff, notes, paymentMethodId, preferredDriverId }),
  });
}

export async function getCurrentRide() {
  return request('/ride/current');
}

export async function cancelRide(rideId, reason) {
  return request('/ride/cancel', { method: 'POST', body: JSON.stringify({ rideId, reason }) });
}

export async function getNearbyDrivers(lat, lng, radiusMeters = 1000) {
  return request(`/drivers/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radiusMeters=${radiusMeters}`);
}

// Driver flows
export async function setDriverOnline(isOnline) {
  return request('/driver/online', { method: 'PUT', body: JSON.stringify({ isOnline }) });
}

export async function updateDriverLocation(location) {
  return request('/driver/location', { method: 'PUT', body: JSON.stringify({ location }) });
}

export async function acceptRide(rideId) {
  return request('/driver/accept', { method: 'PUT', body: JSON.stringify({ rideId }) });
}

export default { setAuthToken, login, register, getProfile, requestRide, getCurrentRide, cancelRide, getNearbyDrivers, setDriverOnline, updateDriverLocation, acceptRide };
