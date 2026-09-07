import { describe, test, expect } from 'vitest';
import { availableActions, ttAvailableActions, canCreateIn, canDelete } from './workflow';

describe('availableActions (Work Order)', () => {
  const engineer = { role: 'Engineer', id: 7, regionId: 1 };
  const otherEngineer = { role: 'Engineer', id: 9, regionId: 1 };
  const supervisor = { role: 'Supervisor', id: 3, regionId: 1 };
  const otherRegionSupervisor = { role: 'Supervisor', id: 4, regionId: 2 };
  const admin = { role: 'Administrator', id: 1 };

  test('Created offers only Accept/Reject, to the assigned engineer only', () => {
    const ticket = { status: 'CR', engineerId: 7, regionId: 1, history: [] };
    const actions = availableActions(ticket, engineer).map((a) => a.action);
    expect(actions.sort()).toEqual(['accept', 'reject']);
    expect(availableActions(ticket, otherEngineer)).toEqual([]);
    expect(availableActions(ticket, supervisor)).toEqual([]);
  });

  test('Administrator can always act, regardless of assignment', () => {
    const ticket = { status: 'CR', engineerId: 7, regionId: 1, history: [] };
    expect(availableActions(ticket, admin).map((a) => a.action).sort()).toEqual(['accept', 'reject']);
  });

  test('In Process: Complete is hidden until at least one Update has been logged', () => {
    const noUpdateYet = { status: 'PR', engineerId: 7, regionId: 1, history: [] };
    const afterUpdate = { status: 'PR', engineerId: 7, regionId: 1, history: [{ action: 'update' }] };

    const before = availableActions(noUpdateYet, engineer).map((a) => a.action);
    expect(before).not.toContain('complete');
    expect(before).toContain('cancel');
    expect(before).toContain('update');

    const after = availableActions(afterUpdate, engineer).map((a) => a.action);
    expect(after).toContain('complete');
  });

  test('Reassign is a supervisor-only action, scoped to their own region', () => {
    const ticket = { status: 'PR', engineerId: 7, regionId: 1, history: [{ action: 'update' }] };
    expect(availableActions(ticket, supervisor).map((a) => a.action)).toContain('reassign');
    expect(availableActions(ticket, otherRegionSupervisor).map((a) => a.action)).not.toContain('reassign');
  });

  test('Closed has no further actions for anyone but Administrator', () => {
    const ticket = { status: 'CL', engineerId: 7, regionId: 1, history: [] };
    expect(availableActions(ticket, engineer)).toEqual([]);
    expect(availableActions(ticket, supervisor)).toEqual([]);
  });
});

describe('ttAvailableActions (Trouble Ticket)', () => {
  const engineer = { role: 'Engineer', id: 7, regionId: 1 };
  const supervisor = { role: 'Supervisor', id: 3, regionId: 1 };
  const msUser = { role: 'MS User', id: 5 };

  test('Open, not yet converted, no update: only Update and Cancel   no Complete/Create Work Order', () => {
    const tt = { status: 'OPEN', regionId: 1, workOrderId: null, woStatus: null };
    const actions = ttAvailableActions(tt, false, engineer).map((a) => a.action);
    expect(actions.sort()).toEqual(['cancel', 'update']);
  });

  test('Open, not yet converted, after an update: Complete and Create Work Order appear', () => {
    const tt = { status: 'OPEN', regionId: 1, workOrderId: null, woStatus: null };
    const actions = ttAvailableActions(tt, true, engineer).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(['update', 'cancel', 'complete', 'create_wo']));
  });

  test('Converted but its work order is still open: only Update   no Complete/Cancel/re-Create', () => {
    const tt = { status: 'OPEN', regionId: 1, workOrderId: 42, woStatus: 'PR' };
    const actions = ttAvailableActions(tt, true, engineer).map((a) => a.action);
    expect(actions).toEqual(['update']);
  });

  test('Converted and its work order reached a terminal state: Complete/Cancel return, Create Work Order does not', () => {
    const tt = { status: 'OPEN', regionId: 1, workOrderId: 42, woStatus: 'CL' };
    const actions = ttAvailableActions(tt, true, engineer).map((a) => a.action);
    expect(actions.sort()).toEqual(['cancel', 'complete', 'update']);
    expect(actions).not.toContain('create_wo');
  });

  test('Completed/Cancelled: Close is supervisor-only, scoped to their region', () => {
    const tt = { status: 'COMPLETED', regionId: 1 };
    expect(ttAvailableActions(tt, true, supervisor).map((a) => a.action)).toEqual(['close']);
    expect(ttAvailableActions(tt, true, { ...supervisor, regionId: 2 })).toEqual([]);
    expect(ttAvailableActions(tt, true, msUser)).toEqual([]);
  });

  test('Closed: no actions for anyone', () => {
    expect(ttAvailableActions({ status: 'CLOSED', regionId: 1 }, true, supervisor)).toEqual([]);
  });
});

describe('canCreateIn / canDelete', () => {
  test('only Administrator, Supervisor and Engineer can create work orders', () => {
    expect(canCreateIn({ role: 'Administrator' })).toBe(true);
    expect(canCreateIn({ role: 'Supervisor' })).toBe(true);
    expect(canCreateIn({ role: 'Engineer' })).toBe(true);
    expect(canCreateIn({ role: 'MS User' })).toBe(false);
    expect(canCreateIn({ role: 'Spare User' })).toBe(false);
  });

  test('only Administrator can delete, and only while still Created', () => {
    expect(canDelete({ role: 'Administrator' }, { status: 'CR' })).toBe(true);
    expect(canDelete({ role: 'Administrator' }, { status: 'PR' })).toBe(false);
    expect(canDelete({ role: 'Supervisor' }, { status: 'CR' })).toBe(false);
  });
});
