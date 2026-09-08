-- Extends role permissions (added earlier today) to cover every
-- remaining page: EHS, both sides of Spare Parts (raising a request vs
-- approving/issuing one), Spare Returns, Inventory, Sites, Assets, and
-- the two checklist-template admin pages.
--
-- This is a genuine REPLACE of the hardcoded role-name checks these
-- pages used before, not an additive layer on top of them -- so an
-- Administrator can now change any role's access (built-in or custom)
-- from the Roles page and have it actually take effect, including
-- taking access AWAY from a built-in role. That's used immediately
-- below: MS User no longer gets Site Database or Assets.
ALTER TABLE role_permissions MODIFY module ENUM(
  'trouble_tickets','work_orders','ehs',
  'spare_requests','spare_fulfillment','spare_transactions','spare_inventory',
  'site_database','assets',
  'wo_reports','tt_reports','ehs_reports','spare_reports','sms',
  'wo_checklist','ehs_checklist'
) NOT NULL;

-- Seed the 6 built-in roles + NOC Engineer so today's real behaviour is
-- reproduced exactly, with two deliberate exceptions: MS User loses
-- Site Database and Assets (both previously granted), and NOC Engineer
-- newly gets a view of Assets (matching the old "everyone can see
-- Assets" rule it inherited before this page became configurable).
-- Administrator needs no rows anywhere -- it bypasses this table
-- entirely (see permissions.js).
INSERT INTO role_permissions (role_id, module, level)
SELECT id, 'ehs', 'manage' FROM roles WHERE name = 'EHS User'
UNION ALL SELECT id, 'ehs', 'view' FROM roles WHERE name IN ('Engineer','Supervisor','MS User')

UNION ALL SELECT id, 'spare_requests', 'manage' FROM roles WHERE name IN ('Engineer','Supervisor')
UNION ALL SELECT id, 'spare_requests', 'view' FROM roles WHERE name IN ('Spare User','MS User')

UNION ALL SELECT id, 'spare_fulfillment', 'manage' FROM roles WHERE name = 'Spare User'

UNION ALL SELECT id, 'spare_transactions', 'manage' FROM roles WHERE name = 'Spare User'
UNION ALL SELECT id, 'spare_transactions', 'view' FROM roles WHERE name = 'MS User'

UNION ALL SELECT id, 'spare_inventory', 'manage' FROM roles WHERE name = 'Spare User'

UNION ALL SELECT id, 'assets', 'manage' FROM roles WHERE name = 'Supervisor'
UNION ALL SELECT id, 'assets', 'view' FROM roles WHERE name IN ('Engineer','EHS User','Spare User','NOC Engineer')

UNION ALL SELECT id, 'ehs_checklist', 'manage' FROM roles WHERE name = 'EHS User';
