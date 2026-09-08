-- Fault Occur Time: entered by whoever raises the trouble ticket, at
-- creation time -- when the fault actually started, not necessarily
-- when it was reported.
-- Fault Resolution Time: entered by whoever completes the ticket, at
-- the same time as the existing completion note -- when the fault was
-- actually fixed on site.
ALTER TABLE trouble_tickets
  ADD COLUMN fault_occurred_at DATETIME NULL AFTER category,
  ADD COLUMN fault_resolved_at DATETIME NULL AFTER fault_occurred_at;
