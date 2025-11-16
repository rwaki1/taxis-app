// Integration test: verifies that ride offers are routed to drivers subscribed to the pickup geohash
// Run with: node backend/scripts/test-socket-geohash.cjs

const io = require('socket.io-client');

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';
const TIMEOUT = 5000;

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  console.log('Test: socket geohash routing (connecting sockets)');

  // choose a pickup location
  const pickup = { lat: 40.7128, lng: -74.0060 }; // NYC
  const far = { lat: 41.0, lng: -75.0 }; // far away

  const driver1 = io(BACKEND);
  const driver2 = io(BACKEND);
  const client = io(BACKEND);

  function once(socket, event, timeout = TIMEOUT) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        socket.off(event);
        reject(new Error('timeout'));
      }, timeout);
      socket.once(event, (payload) => {
        clearTimeout(t);
        resolve(payload);
      });
    });
  }

  // Promisify connect
  await Promise.all([
    new Promise((r) => driver1.on('connect', r)),
    new Promise((r) => driver2.on('connect', r)),
    new Promise((r) => client.on('connect', r)),
  ]);

  console.log('connected sockets');

  // subscribe driver1 to nearby grids around pickup
  const sub1 = new Promise((resolve) => {
    driver1.emit('driver:subscribe', { lat: pickup.lat, lng: pickup.lng, radiusMeters: 1000 }, (res) => resolve(res));
  });
  // subscribe driver2 to a far location
  const sub2 = new Promise((resolve) => {
    driver2.emit('driver:subscribe', { lat: far.lat, lng: far.lng, radiusMeters: 1000 }, (res) => resolve(res));
  });

  const [r1, r2] = await Promise.all([sub1, sub2]);
  console.log('subscriptions:', { r1, r2 });

  // set up listeners for ride:offer
  let driver1Got = false;
  let driver2Got = false;

  driver1.on('ride:offer', (p) => {
    driver1Got = true;
    console.log('driver1 received offer', p && p.offerGrid);
  });
  driver2.on('ride:offer', (p) => {
    driver2Got = true;
    console.log('driver2 received offer unexpectedly', p && p.offerGrid);
  });

  // client emits ride-requested
  client.emit('ride-requested', { id: 'test-ride-1', pickup });

  // wait for a short period
  await wait(1500);

  // Evaluate expectations
  console.log('driver1Got=', driver1Got, 'driver2Got=', driver2Got);

  // clean up
  driver1.disconnect();
  driver2.disconnect();
  client.disconnect();

  if (driver1Got && !driver2Got) {
    console.log('✅ Test passed: offer routed to subscribed driver only');
    process.exit(0);
  } else {
    console.error('❌ Test failed: routing unexpected', { driver1Got, driver2Got });
    process.exit(2);
  }
}

run().catch((err) => {
  console.error('Test error:', err && err.message);
  process.exit(1);
});
