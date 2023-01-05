import { forwardRef, resolveForwardRef } from '../di/forward-ref';
import { Class } from '../di/types-and-models';

describe('forwardRef', function () {
  it('should wrap and unwrap the reference', () => {
    const ref = forwardRef(() => String);
    expect(ref instanceof Class).toBe(true);
    expect(resolveForwardRef(ref)).toBe(String);
  });
});
