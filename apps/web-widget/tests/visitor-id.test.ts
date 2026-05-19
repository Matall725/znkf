import { afterEach, describe, expect, it } from 'vitest';
import { clearVisitorId, getOrCreateVisitorId } from '../src/visitor-id';

describe('visitor-id', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('generates a new UUID visitor ID on first call', () => {
    const id = getOrCreateVisitorId();

    expect(id).toBeTruthy();
    expect(id.length).toBeGreaterThan(0);
    // UUID format: 8-4-4-4-12 hex chars
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('persists visitor ID to localStorage', () => {
    const id1 = getOrCreateVisitorId();
    const stored = localStorage.getItem('znkfxt_visitor_id');

    expect(stored).toBe(id1);
  });

  it('returns the same ID on subsequent calls', () => {
    const id1 = getOrCreateVisitorId();
    const id2 = getOrCreateVisitorId();

    expect(id2).toBe(id1);
  });

  it('generates a new ID after clearing', () => {
    const id1 = getOrCreateVisitorId();
    clearVisitorId();
    const id2 = getOrCreateVisitorId();

    expect(id2).not.toBe(id1);
  });
});
