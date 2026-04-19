import { describe, expect, it } from 'vitest';

describe('web widget test framework', () => {
  it('runs in a browser-like document environment', () => {
    expect(window.document.createElement('section').tagName).toBe('SECTION');
  });
});
