-- Trouble Tickets (raised before a Work Order exists; "Create Work Order"
-- copies its fields onto a new WO and closes the TT) + direct/off-process
-- Spare Parts transactions (site swaps a part without a formal request).

ALTER TABLE ticket_history
  MODIFY entity_type ENUM('work_order','ehs_record','spare_request','trouble_ticket') NOT NULL;

ALTER TABLE spare_transactions
  MODIFY type ENUM('Issue','Return','Adjustment','Restock','Sent for Service','Direct Issue','Direct Return') NOT NULL;

CREATE TABLE trouble_tickets (
  id INT NOT NULL AUTO_INCREMENT,
  tt_no VARCHAR(30) NOT NULL,
  site_id INT NOT NULL,
  site_code VARCHAR(30) NOT NULL,
  site_name VARCHAR(120) NOT NULL,
  region_id INT NOT NULL,
  region_name VARCHAR(60) NOT NULL,
  site_location VARCHAR(255) DEFAULT NULL,
  site_priority ENUM('Low','Medium','High','Critical') NOT NULL,
  asset_id INT DEFAULT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('Low','Medium','High','Critical','Emergency') NOT NULL DEFAULT 'Medium',
  status ENUM('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
  engineer_id INT NOT NULL,
  work_order_id INT DEFAULT NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME DEFAULT NULL,
  closed_by INT DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY tt_no (tt_no),
  KEY idx_tt_site (site_id),
  KEY idx_tt_region (region_id),
  KEY idx_tt_status (status),
  KEY idx_tt_engineer (engineer_id),
  KEY idx_tt_wo (work_order_id),
  CONSTRAINT trouble_tickets_ibfk_1 FOREIGN KEY (site_id) REFERENCES sites (id),
  CONSTRAINT trouble_tickets_ibfk_2 FOREIGN KEY (region_id) REFERENCES regions (id),
  CONSTRAINT trouble_tickets_ibfk_3 FOREIGN KEY (asset_id) REFERENCES assets (id),
  CONSTRAINT trouble_tickets_ibfk_4 FOREIGN KEY (engineer_id) REFERENCES users (id),
  CONSTRAINT trouble_tickets_ibfk_5 FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT trouble_tickets_ibfk_6 FOREIGN KEY (closed_by) REFERENCES users (id),
  CONSTRAINT trouble_tickets_ibfk_7 FOREIGN KEY (work_order_id) REFERENCES work_orders (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
