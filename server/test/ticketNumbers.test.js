import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeholderTicketNo, finalizeTicketNo } from '../ticketNumbers.js';

test('placeholderTicketNo returns a unique, obviously-temporary value', () => {
  const a = placeholderTicketNo();
  const b = placeholderTicketNo();
  assert.match(a, /^TMP-\d+-[a-z0-9]+$/);
  assert.notEqual(a, b, 'two calls in a row must not collide');
});

test('finalizeTicketNo builds <PREFIX>-<YYYYMMDD>-<id padded to 3 digits> and writes it', async () => {
  const calls = [];
  const fakeConn = {
    query: async (sql, params) => { calls.push({ sql, params }); return [{}]; },
  };

  const no = await finalizeTicketNo(fakeConn, 'work_orders', 'wo_no', 'CM', 7);

  const today = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${today.getFullYear()}${p(today.getMonth() + 1)}${p(today.getDate())}`;

  assert.equal(no, `CM-${stamp}-007`);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /UPDATE work_orders SET wo_no = \?/);
  assert.deepEqual(calls[0].params, [no, 7]);
});

test('finalizeTicketNo pads ids under 100 but does not truncate larger ones', async () => {
  const fakeConn = { query: async () => [{}] };
  const small = await finalizeTicketNo(fakeConn, 'trouble_tickets', 'tt_no', 'TT', 3);
  const large = await finalizeTicketNo(fakeConn, 'trouble_tickets', 'tt_no', 'TT', 1234);
  assert.match(small, /-003$/);
  assert.match(large, /-1234$/);
});
