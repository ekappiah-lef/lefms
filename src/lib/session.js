// =====================================================================
// Session control: decodes the JWT's own exp claim (no server round
// trip) so the UI can proactively log out exactly when the token dies,
// and a separate idle timer that logs out after a period of no
// keyboard/mouse/touch activity   independent of token life, so an
// abandoned-but-unexpired tab doesn't sit "logged in" indefinitely.
// =====================================================================
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of no activity
export const IDLE_WARNING_MS = 60 * 1000; // warn this long before logging out

// Reads a JWT's payload without verifying its signature   only ever used
// to read the (already server-issued, already-trusted-this-session) exp
// claim for UI scheduling. The server still verifies the signature on
// every request; this never substitutes for that.
export function decodeTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

// Calls onWarn once IDLE_WARNING_MS before the deadline, then onExpire at
// the deadline itself. Any activity event pushes the deadline back out to
// now + IDLE_TIMEOUT_MS (and calls onActivity, e.g. to dismiss a warning
// banner that's currently showing). Returns a cleanup function.
export function startIdleWatcher({ onWarn, onExpire, onActivity }) {
  let warnTimer;
  let expireTimer;

  const clear = () => { clearTimeout(warnTimer); clearTimeout(expireTimer); };

  const reset = () => {
    clear();
    warnTimer = setTimeout(onWarn, IDLE_TIMEOUT_MS - IDLE_WARNING_MS);
    expireTimer = setTimeout(onExpire, IDLE_TIMEOUT_MS);
  };

  const onActivityEvent = () => { onActivity?.(); reset(); };

  reset();
  ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivityEvent, { passive: true }));

  return () => {
    clear();
    ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivityEvent));
  };
}
