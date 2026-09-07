import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowError, TRANSITIONS } from '../workflow.js';

test('WorkflowError carries a message and defaults status to 400', () => {
  const e = new WorkflowError('bad request');
  assert.equal(e.message, 'bad request');
  assert.equal(e.status, 400);
  assert.ok(e instanceof Error);
});

test('WorkflowError accepts an explicit status', () => {
  const e = new WorkflowError('conflict', 409);
  assert.equal(e.status, 409);
});

// Regression test for the work order state machine's shape   catches an
// accidental edit to TRANSITIONS breaking the CR/PR/CO/CL/RJ/CA flow
// without needing a database.
test('work order transitions match the documented state machine', () => {
  assert.deepEqual(TRANSITIONS.accept.from, ['CR']);
  assert.equal(TRANSITIONS.accept.to, 'PR');
  assert.deepEqual(TRANSITIONS.reject.from, ['CR']);
  assert.equal(TRANSITIONS.reject.to, 'RJ');
  assert.deepEqual(TRANSITIONS.complete.from, ['PR']);
  assert.equal(TRANSITIONS.complete.to, 'CO');
  assert.deepEqual(TRANSITIONS.cancel.from, ['PR']);
  assert.equal(TRANSITIONS.cancel.to, 'CA');
  assert.deepEqual(TRANSITIONS.close.from.sort(), ['CA', 'CO']);
  assert.equal(TRANSITIONS.close.to, 'CL');
  assert.deepEqual(TRANSITIONS.reopen.from, ['RJ']);
  assert.equal(TRANSITIONS.reopen.to, 'CR');
});
