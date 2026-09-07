// =====================================================================
// Real aggregation queries   every number here is computed straight off
// work_orders (and its linked ehs_records / spare_requests), no padding.
// =====================================================================
import { Router } from 'express';
import { pool } from '../db.js';
import { scopeRegion } from '../auth.js';

const router = Router();

const EMPTY_STATUS = { CR: 0, PR: 0, CO: 0, CL: 0, RJ: 0, CA: 0 };
const WO_TYPES = ['CM', 'PM', 'PLM'];

async function statusCounts(regionId) {
  const params = []; let where = '';
  if (regionId) { where = 'WHERE region_id = ?'; params.push(regionId); }
  const [rows] = await pool.query(`SELECT status, COUNT(*) c FROM work_orders ${where} GROUP BY status`, params);
  const map = { ...EMPTY_STATUS };
  rows.forEach((r) => { map[r.status] = r.c; });
  return map;
}

async function typeCounts(regionId) {
  const params = []; let where = '';
  if (regionId) { where = 'WHERE region_id = ?'; params.push(regionId); }
  const [rows] = await pool.query(`SELECT wo_type, COUNT(*) c FROM work_orders ${where} GROUP BY wo_type`, params);
  const map = { CM: 0, PM: 0, PLM: 0 };
  rows.forEach((r) => { map[r.wo_type] = r.c; });
  return map;
}

async function monthlyTrend(regionId) {
  const params = []; let where = '';
  if (regionId) { where = 'WHERE region_id = ?'; params.push(regionId); }
  const [rows] = await pool.query(`SELECT DATE_FORMAT(created_at, '%Y-%m') ym, COUNT(*) c FROM work_orders ${where} GROUP BY ym ORDER BY ym`, params);
  return rows;
}

async function byEngineer(regionId) {
  const params = []; let where = '';
  if (regionId) { where = 'WHERE t.region_id = ?'; params.push(regionId); }
  const [rows] = await pool.query(
    `SELECT eu.id, eu.full_name AS engineer, COUNT(*) AS total,
            SUM(t.status IN ('CO','CL')) AS completed, SUM(t.status = 'CL') AS closed
     FROM work_orders t JOIN users eu ON eu.id = t.engineer_id
     ${where} GROUP BY eu.id, eu.full_name ORDER BY total DESC`, params
  );
  return rows.map((r) => ({ ...r, completed: Number(r.completed), closed: Number(r.closed), completionRate: r.total ? Math.round((r.completed / r.total) * 100) : 0 }));
}

async function aging(regionId) {
  const params = []; let where = "status IN ('CR','PR')";
  if (regionId) { where += ' AND region_id = ?'; params.push(regionId); }
  const [rows] = await pool.query(
    `SELECT id, wo_no AS no, wo_type AS type, title, status, created_at, TIMESTAMPDIFF(HOUR, created_at, NOW()) AS ageHours
     FROM work_orders WHERE ${where} ORDER BY created_at ASC LIMIT 8`, params
  );
  return rows;
}

router.get('/overview', async (req, res) => {
  const regionId = scopeRegion(req);
  const combinedStatus = await statusCounts(regionId);
  const byType = await typeCounts(regionId);
  const total = Object.values(combinedStatus).reduce((s, v) => s + v, 0);
  const open = combinedStatus.CR + combinedStatus.PR;
  const completed = combinedStatus.CO + combinedStatus.CL;
  const closed = combinedStatus.CL;

  const trend = await monthlyTrend(regionId);
  const engineerPerformance = await byEngineer(regionId);
  const agingList = await aging(regionId);

  const assetWhere = regionId ? 'WHERE a.site_id IN (SELECT id FROM sites WHERE region_id = ?)' : '';
  const assetParams = regionId ? [regionId] : [];
  const [assetsByStatus] = await pool.query(`SELECT a.status, COUNT(*) c FROM assets a ${assetWhere} GROUP BY a.status`, assetParams);

  // Full status breakdown per region (not a lossy open/completed/closed
  // rollup) so the "Work Orders by Region" chart can use the same clean
  // per-status categories as the Status Mix donut.
  const regionWhere = regionId ? 'WHERE w.region_id = ?' : '';
  const regionParams = regionId ? [regionId] : [];
  const [byRegionStatus] = await pool.query(
    `SELECT w.region_id, w.region_name, w.status, COUNT(*) c
     FROM work_orders w ${regionWhere} GROUP BY w.region_id, w.region_name, w.status`, regionParams
  );
  const byRegionMap = new Map();
  for (const r of byRegionStatus) {
    if (!byRegionMap.has(r.region_id)) byRegionMap.set(r.region_id, { regionId: r.region_id, regionName: r.region_name, ...EMPTY_STATUS });
    byRegionMap.get(r.region_id)[r.status] = r.c;
  }
  const byRegion = [...byRegionMap.values()].sort((a, b) => a.regionName.localeCompare(b.regionName));

  // Same per-status breakdown, one row per Site ("Data Center")   every
  // site's code is DC-<region>-<seq>, i.e. each site IS a data centre in
  // this domain, so this is the "by data centre" view of the same data.
  const [bySiteStatus] = await pool.query(
    `SELECT w.site_id, w.site_code, w.site_name, w.status, COUNT(*) c
     FROM work_orders w ${regionWhere} GROUP BY w.site_id, w.site_code, w.site_name, w.status`, regionParams
  );
  const bySiteMap = new Map();
  for (const r of bySiteStatus) {
    if (!bySiteMap.has(r.site_id)) bySiteMap.set(r.site_id, { siteId: r.site_id, siteCode: r.site_code, siteName: r.site_name, ...EMPTY_STATUS });
    bySiteMap.get(r.site_id)[r.status] = r.c;
  }
  const bySite = [...bySiteMap.values()].sort((a, b) => a.siteCode.localeCompare(b.siteCode));

  res.json({
    total, open, completed, closed,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    closeRate: total ? Math.round((closed / total) * 100) : 0,
    combinedStatus, byType, trend, engineerPerformance, agingList, assetsByStatus, byRegion, bySite,
  });
});

router.get('/ehs', async (req, res) => {
  const regionId = scopeRegion(req);
  const params = []; let where = '';
  if (regionId) { where = 'WHERE w.region_id = ?'; params.push(regionId); }
  const [rows] = await pool.query(
    `SELECT eh.status, COUNT(*) c FROM ehs_records eh JOIN work_orders w ON w.id = eh.work_order_id ${where} GROUP BY eh.status`, params
  );
  const statusCounts = { PENDING: 0, SUBMITTED: 0, REVIEWED: 0 };
  rows.forEach((r) => { statusCounts[r.status] = r.c; });

  const [outcomeRows] = await pool.query(
    `SELECT eh.outcome, COUNT(*) c FROM ehs_records eh JOIN work_orders w ON w.id = eh.work_order_id
     WHERE eh.outcome IS NOT NULL ${regionId ? 'AND w.region_id = ?' : ''} GROUP BY eh.outcome`,
    regionId ? [regionId] : []
  );
  const outcomeCounts = { Approved: 0, Flagged: 0 };
  outcomeRows.forEach((r) => { outcomeCounts[r.outcome] = r.c; });

  const total = Object.values(statusCounts).reduce((s, v) => s + v, 0);
  const reviewedTotal = outcomeCounts.Approved + outcomeCounts.Flagged;

  const [pendingList] = await pool.query(
    `SELECT eh.id, eh.ehs_no, w.wo_no, w.title, eh.status, eh.created_at, TIMESTAMPDIFF(HOUR, eh.created_at, NOW()) AS ageHours
     FROM ehs_records eh JOIN work_orders w ON w.id = eh.work_order_id
     ${where ? where + ' AND' : 'WHERE'} eh.status IN ('PENDING','SUBMITTED') ORDER BY eh.created_at ASC LIMIT 8`, params
  );

  res.json({
    total, statusCounts, outcomeCounts,
    flaggedRate: reviewedTotal ? Math.round((outcomeCounts.Flagged / reviewedTotal) * 100) : 0,
    pendingList,
  });
});

router.get('/spares', async (req, res) => {
  const regionId = scopeRegion(req);
  const params = []; let where = '';
  if (regionId) { where = 'WHERE w.region_id = ?'; params.push(regionId); }
  const [statusRows] = await pool.query(
    `SELECT r.status, COUNT(*) c FROM spare_requests r JOIN work_orders w ON w.id = r.work_order_id ${where} GROUP BY r.status`, params
  );
  const statusCounts = { Requested: 0, Approved: 0, Rejected: 0, Issued: 0, 'Partially Issued': 0, Closed: 0 };
  statusRows.forEach((r) => { statusCounts[r.status] = r.c; });
  const total = Object.values(statusCounts).reduce((s, v) => s + v, 0);

  const [[{ lowStockCount }]] = await pool.query(`SELECT COUNT(*) AS lowStockCount FROM spare_items WHERE is_active = 1 AND quantity_on_hand <= reorder_level`);
  const [lowStockList] = await pool.query(
    `SELECT id, sku, name, quantity_on_hand AS quantityOnHand, reorder_level AS reorderLevel FROM spare_items WHERE is_active = 1 AND quantity_on_hand <= reorder_level ORDER BY (quantity_on_hand - reorder_level) ASC LIMIT 8`
  );

  const [pendingList] = await pool.query(
    `SELECT r.id, r.request_no, w.wo_no, s.name AS site_name, r.status, r.created_at
     FROM spare_requests r JOIN work_orders w ON w.id = r.work_order_id JOIN sites s ON s.id = r.site_id
     ${where ? where + ' AND' : 'WHERE'} r.status = 'Requested' ORDER BY r.created_at ASC LIMIT 8`, params
  );

  res.json({ total, statusCounts, lowStockCount, lowStockList, pendingList });
});

export default router;
