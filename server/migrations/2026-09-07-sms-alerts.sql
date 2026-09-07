-- SMS alerts (SMSOnlineGH): engineers get texted when a work order is
-- assigned to them; configurable Groups (name + phone list) get texted
-- for High/Critical work orders and work orders pending 10+ days,
-- optionally filtered to one region per config row.

CREATE TABLE sms_groups (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sms_group_members (
  id INT NOT NULL AUTO_INCREMENT,
  group_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sms_members_group (group_id),
  CONSTRAINT sms_group_members_ibfk_1 FOREIGN KEY (group_id) REFERENCES sms_groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row = "for this event (optionally limited to one region), text this
-- group". Multiple rows can target the same event with different
-- groups/regions, e.g. a Greater Accra group and a separate Ashanti group
-- both configured for wo_high_critical.
CREATE TABLE sms_configs (
  id INT NOT NULL AUTO_INCREMENT,
  event_type ENUM('wo_high_critical','wo_pending') NOT NULL,
  group_id INT NOT NULL,
  region_id INT DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sms_configs_event (event_type),
  KEY idx_sms_configs_group (group_id),
  KEY idx_sms_configs_region (region_id),
  CONSTRAINT sms_configs_ibfk_1 FOREIGN KEY (group_id) REFERENCES sms_groups (id) ON DELETE CASCADE,
  CONSTRAINT sms_configs_ibfk_2 FOREIGN KEY (region_id) REFERENCES regions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit trail + dedup (a "pending 10+ days" work order must only ever
-- trigger its group alert once).
CREATE TABLE sms_log (
  id INT NOT NULL AUTO_INCREMENT,
  work_order_id INT DEFAULT NULL,
  event_type VARCHAR(30) NOT NULL,
  recipient_type ENUM('engineer','group') NOT NULL,
  recipient_label VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  status ENUM('sent','failed') NOT NULL,
  response TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sms_log_wo (work_order_id),
  KEY idx_sms_log_event (event_type),
  CONSTRAINT sms_log_ibfk_1 FOREIGN KEY (work_order_id) REFERENCES work_orders (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
