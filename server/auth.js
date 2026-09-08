// =====================================================================
// Real authentication: bcrypt password check, JWT issue + verification.
// Every route other than /api/auth/login and /api/health requires a
// valid bearer token; authorize(...roles) further gates by role.
// =====================================================================
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET is not set   refusing to start with an insecure default.');

// How long an access token is valid for before the app forces a re-login
// (see src/lib/session.js on the frontend, which also proactively logs
// the user out at this same moment rather than waiting for a stray
// 401). Override via .env for a shorter/longer session policy.
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, staffNo: user.staff_no, fullName: user.full_name, role: user.role, roleId: user.role_id, regionId: user.region_id },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });
  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  // Re-checked on every request, not just at login: a deactivated (or
  // deleted) account's existing token must stop working immediately, not
  // whenever it happens to expire naturally up to EXPIRES_IN later.
  try {
    const [[row]] = await pool.query('SELECT is_active FROM users WHERE id = ?', [payload.id]);
    if (!row || !row.is_active) return res.status(401).json({ error: 'This account is no longer active' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
  req.user = payload;
  next();
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    next();
  };
}

// Only Supervisor and Engineer are region-scoped -- a Supervisor manages
// their own region, an Engineer is a site-based field role assigned to
// one region. Every other role (Administrator, EHS User, Spare User, MS
// User, and any custom role such as "NOC Engineer") is unrestricted by
// region: a NOC Engineer isn't tied to a single site/region the way a
// field Engineer is, so it doesn't get a region at all (see Users.jsx's
// REGION_REQUIRED_ROLES, which mirrors this same list).
// A route calls this to build its own WHERE-scoping; it returns the
// region id to filter by, or null for "no region filter".
const REGION_RESTRICTED_ROLES = ['Supervisor', 'Engineer'];
export function scopeRegion(req) {
  if (!REGION_RESTRICTED_ROLES.includes(req.user.role)) {
    return req.query.region ? Number(req.query.region) : null;
  }
  return req.user.regionId;
}
