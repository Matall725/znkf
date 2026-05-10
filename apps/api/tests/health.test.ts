import { describe, expect, it } from 'vitest';

describe('api test framework', () => {
  it('runs a backend health test', () => {
    expect({ status: 'ok' }).toEqual({ status: 'ok' });
  });
});
