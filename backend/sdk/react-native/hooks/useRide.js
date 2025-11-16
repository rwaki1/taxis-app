// Example React hook to manage a single ride's realtime updates
import { useEffect, useState, useRef } from 'react';
import socketManager from '../socket';
import api from '../api';

export function useRide(rideId, token) {
  const [ride, setRide] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      // fetch the current ride state
      try {
        if (token) api.setAuthToken(token);
        const r = await api.getCurrentRide();
        if (mounted) setRide(r && r.data ? r.data.ride : r);
      } catch (e) {
        // ignore for now
      }

      // connect socket and join ride room
      socketRef.current = socketManager.connect(token);
      socketRef.current.on('ride:update', (payload) => {
        if (!mounted) return;
        if (payload && payload.rideId === rideId) setRide((prev) => Object.assign({}, prev, payload));
      });
      socketManager.joinRideRoom(rideId);
    }

    init();

    return () => {
      mounted = false;
      try { socketManager.leaveRideRoom(rideId); } catch (e) {}
      try { socketManager.off('ride:update'); } catch (e) {}
    };
  }, [rideId, token]);

  return { ride, setRide };
}

export default useRide;
