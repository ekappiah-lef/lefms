-- Direct Issue/Direct Return can now name an item that isn't in our own
-- catalog at all (a site swaps in whatever part it has, or a vendor is
-- shipping something straight to a site). spare_item_id becomes optional;
-- item_name carries the free-text name for those ad-hoc rows (no stock
-- effect, since it was never in our inventory to begin with).
ALTER TABLE spare_transactions
  MODIFY spare_item_id INT NULL,
  ADD COLUMN item_name VARCHAR(160) NULL AFTER spare_item_id;
