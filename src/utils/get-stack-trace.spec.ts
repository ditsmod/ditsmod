import { getStackTrace } from './get-stack-trace';

describe('getStackTrace()', () => {
  it('should return a trace', () => {
    expect(getStackTrace().includes('Stack:')).toBe(true);
  });
});
