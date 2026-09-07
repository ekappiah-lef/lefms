-- Trouble Tickets: drop the assigned-engineer requirement (a TT has no
-- assignee until/unless it becomes a Work Order) and give it its own
-- small lifecycle (OPEN -> COMPLETED|CANCELLED -> CLOSED, plus non-status
-- Update entries) instead of only Create/Close.
ALTER TABLE trouble_tickets
  DROP FOREIGN KEY trouble_tickets_ibfk_4,
  DROP INDEX idx_tt_engineer,
  DROP COLUMN engineer_id,
  MODIFY status ENUM('OPEN','COMPLETED','CANCELLED','CLOSED') NOT NULL DEFAULT 'OPEN';

-- Evidence attachments (photos/PDF/Word) on direct/off-process Spare
-- Parts movements (Spare Returns).
ALTER TABLE attachments
  MODIFY entity_type ENUM('work_order','ehs_record','spare_request','spare_transaction') NOT NULL;
