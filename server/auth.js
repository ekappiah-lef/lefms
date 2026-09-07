// =====================================================================
// Real authentication: bcrypt password check, JWT issue + verification.
// Every route other than /api/auth/login and /api/health requires a
// valid bearer token; authorize(...roles) further gates by role.
// =====================================================================
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET is not set   refusing to start with an insecure default.');

export function signToken(user) {
  return jwt.sign(
    { id: user.id, staffNo: user.staff_no, fullName: user.full_name, role: user.role, regionId: user.region_id },
    SECRET,
    { expiresIn: '12h' }
  );
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    next();
  };
}

// A Supervisor may only act within their own region; Administrator, EHS
// User, Spare User and MS User are unrestricted by region (MS User's
// restriction is read-only, enforced via authorize() on mutating routes).
// A route calls this to build its own WHERE-scoping; it returns the
// region id to filter by, or null for "no region filter".
export function scopeRegion(req) {
  if (['Administrator', 'EHS User', 'Spare User', 'MS User'].includes(req.user.role)) {
    return req.query.region ? Number(req.query.region) : null;
  }
  return req.user.regionId;
}
