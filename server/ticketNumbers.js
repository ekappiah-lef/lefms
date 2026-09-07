// Ticket numbers: <TYPE>-<YYYYMMDD>-<seq>, e.g. CM-20260903-001,
// PM-20260903-002, PLM-20260903-003. Derived from the row's own
// AUTO_INCREMENT id (never reused, even after a delete) rather than a
// COUNT(*) of existing rows   a count collides with an already-used
// number as soon as any row is ever deleted.
//
// Usage: insert the row with a temporary unique placeholder for the number
// column, then call finalizeTicketNo with the new id to set the real one.
export function placeholderTicketNo() {
  return `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export async function finalizeTicketNo(conn, table, col, typePrefix, id) {
  const no = `${typePrefix}-${todayStamp()}-${String(id).padStart(3, '0')}`;
  await conn.query(`UPDATE ${table} SET ${col} = ? WHERE id = ?`, [no, id]);
  return no;
}
