/**
 * Simple in-memory registry of control flags for running scrape jobs.
 * Keyed by ScrapeJob._id (string). Works for a single-process deployment;
 * for a multi-instance deployment behind a load balancer, replace with
 * Redis pub/sub flags keyed the same way.
 */
const controls = new Map();

function register(jobId) {
  controls.set(jobId, { stop: false, pause: false });
}

function requestStop(jobId) {
  const c = controls.get(jobId);
  if (c) c.stop = true;
}

function requestPause(jobId, value = true) {
  const c = controls.get(jobId);
  if (c) c.pause = value;
}

function shouldStop(jobId) {
  return async () => {
    const c = controls.get(jobId);
    if (!c) return false;
    // Busy-wait on pause without burning CPU
    while (c.pause && !c.stop) {
      await new Promise((r) => setTimeout(r, 1000));
    }
    return c.stop;
  };
}

function clear(jobId) {
  controls.delete(jobId);
}

module.exports = { register, requestStop, requestPause, shouldStop, clear };
