-- ONE-TIME, DESTRUCTIVE: clears every table except Users (kept only for
-- accounts with "lefsignature" in their email, or role = Engineer) and
-- the reference/config tables the app needs to keep working (roles,
-- role_permissions, regions, sms_groups, sms_group_members, sms_configs,
-- wo_checklist_templates, ehs_checklist_templates).
--
-- trouble_tickets is now wiped too, along with everything else -- the
-- real 9 tickets from the incident log get inserted fresh afterward via
-- server/data-backfills/2026-09-08-incident-log.sql.

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE work_order_checklist;
TRUNCATE TABLE work_order_comments;
TRUNCATE TABLE work_orders;

TRUNCATE TABLE ehs_checklist;
TRUNCATE TABLE ehs_records;

TRUNCATE TABLE spare_transactions;
TRUNCATE TABLE spare_request_items;
TRUNCATE TABLE spare_requests;
TRUNCATE TABLE spare_items;

TRUNCATE TABLE attachments;
TRUNCATE TABLE sms_log;

TRUNCATE TABLE assets;
TRUNCATE TABLE sites;

TRUNCATE TABLE ticket_history;
TRUNCATE TABLE trouble_tickets;

DELETE u FROM users u
JOIN roles r ON r.id = u.role_id
WHERE u.email NOT LIKE '%lefsignature%'
  AND r.name <> 'Engineer';

SET FOREIGN_KEY_CHECKS = 1;
