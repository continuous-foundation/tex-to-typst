import { describe, it, expect } from 'vitest';
import { areBracketsBalanced } from './utils';

describe('areBracketsBalanced', () => {
  it.each([
    // Each test case is an object (or array) with the inputs and expected result
    { input: '', expected: true },
    { input: '()', expected: true },
    { input: '()[]{}', expected: true },
    { input: '([{}])', expected: true },
    { input: '(([]){})', expected: true },
    { input: '{([([])])}', expected: true },
    { input: '(]', expected: false },
    { input: '([)]', expected: false },
    { input: '(()', expected: false },
    { input: '(()]', expected: false },
  ])('should return $expected for "$input"', ({ input, expected }) => {
    expect(areBracketsBalanced(input)).toBe(expected);
  });

  it('should ignore non-bracket characters', () => {
    expect(areBracketsBalanced('abc(def)ghi')).toBe(true);
    expect(areBracketsBalanced('(abc]def')).toBe(false);
  });
});
