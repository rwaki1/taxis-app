// Helper to subscribe the driver client to nearby grid rooms via socket
import socketManager from './socket';

/**
 * Subscribe the connected socket to nearby geogrid rooms.
 * - socket must be connected (via socketManager.connect(token))
 * - server will join the socket to appropriate rooms
 *
 * @param {string} token
 * @param {{lat:number,lng:number}} location
 * @param {number} radiusMeters
 * @returns {Promise<{ok:boolean,keys?:string[],error?:string}>}
 */
export async function subscribeToNearbyGrids(token, location, radiusMeters = 1000) {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return { ok: false, error: 'INVALID_LOCATION' };
  const socket = socketManager.connect(token);
  return new Promise((resolve) => {
    try {
      socket.emit('driver:subscribe', { lat: location.lat, lng: location.lng, radiusMeters }, (res) => {
        resolve(res || { ok: true });
      });
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

export default { subscribeToNearbyGrids };
