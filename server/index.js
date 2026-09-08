// =====================================================================
// LEF MS API   Work Orders, EHS and Spare Parts for power, passive
// infrastructure, AC/cooling and data-centre operations.
// Node/Express + MySQL. Every route below /api except /auth/login and
// /health requires a verified JWT (see auth.js)   nothing here trusts an
// unauthenticated request.
// =====================================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { pool, ping } from './db.js';
import { authenticate } from './auth.js';

import authRoutes from './routes/auth.js';
import regionRoutes from './routes/regions.js';
import siteRoutes from './routes/sites.js';
import userRoutes from './routes/users.js';
import assetRoutes from './routes/assets.js';
import workOrderRoutes from './routes/workOrders.js';
import troubleTicketRoutes from './routes/troubleTickets.js';
import ehsRecordRoutes from './routes/ehsRecords.js';
import spareItemRoutes from './routes/spareItems.js';
import spareRequestRoutes from './routes/spareRequests.js';
import spareTransactionRoutes from './routes/spareTransactions.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import attachmentRoutes from './routes/attachments.js';
import woChecklistTemplateRoutes from './routes/woChecklistTemplates.js';
import ehsChecklistTemplateRoutes from './routes/ehsChecklistTemplates.js';
import smsGroupRoutes from './routes/smsGroups.js';
import smsConfigRoutes from './routes/smsConfigs.js';
import smsLogRoutes from './routes/smsLog.js';
import roleRoutes from './routes/roles.js';
import { checkPendingWorkOrders } from './smsAlerts.js';

dotenv.config();
const app = express();

// Behind the nginx reverse proxy in production (see docker-compose.yml) so
// req.ip/X-Forwarded-For is trusted from exactly one hop   needed for the
// rate limiters below to key on the real client IP instead of nginx's.
app.set('trust proxy', 1);

app.use(helmet());

// CORS_ORIGIN: comma-separated allowlist (e.g. "https://lefms.example.com").
// Left unset, everything is allowed   fine for local dev, never for a real
// deployment; set it in .env once you have a real frontend origin.
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors(corsOrigins.length ? { origin: corsOrigins } : {}));

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// General API rate limit   generous, just to blunt scraping/DoS-by-script,
// not normal usage. Auth gets its own much stricter limiter below since
// that's the endpoint actually worth throttling against brute force.
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', async (req, res) => {
  try { await ping(); res.json({ status: 'ok', db: 'connected' }); }
  catch (e) { res.status(500).json({ status: 'error', db: e.message }); }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // per IP; the per-account lock in routes/auth.js is the tighter of the two
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this address. Try again later.' },
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);

// Everything else requires a valid bearer token.
app.use('/api', authenticate);
app.use('/api/regions', regionRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/trouble-tickets', troubleTicketRoutes);
app.use('/api/ehs-records', ehsRecordRoutes);
app.use('/api/spare-items', spareItemRoutes);
app.use('/api/spare-requests', spareRequestRoutes);
app.use('/api/spare-transactions', spareTransactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/wo-checklist-templates', woChecklistTemplateRoutes);
app.use('/api/ehs-checklist-templates', ehsChecklistTemplateRoutes);
app.use('/api/sms-groups', smsGroupRoutes);
app.use('/api/sms-configs', smsConfigRoutes);
app.use('/api/sms-log', smsLogRoutes);
app.use('/api/roles', roleRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`LEF MS API listening on :${port}`));

// "Pending 10+ days" alert   a periodic sweep, not event-driven (nothing
// "happens" to make a work order become overdue). Runs shortly after
// startup, then every 6 hours; each work order only ever triggers this
// once (see checkPendingWorkOrders' dedup query against sms_log).
setTimeout(checkPendingWorkOrders, 60 * 1000);
setInterval(checkPendingWorkOrders, 6 * 60 * 60 * 1000);
