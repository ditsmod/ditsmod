import { ChainError } from '@ts-stack/chain-error';

import { HttpStatus } from '#utils/http-status-codes.js';
import { CustomError } from '#error/custom-error.js';

describe('CustomError', () => {
  it('CustomError is instanceof ChainError', () => {
    expect(new CustomError({}) instanceof ChainError).toBe(true);
  });

  it('set msg1 and msg2 with arguments', () => {
    const msg1 = 'frontend %s message';
    const msg2 = 'backend %s message';
    const cause = new Error();
    const err = new CustomError({ msg1, msg2, level: 'warn', status: HttpStatus.CONFLICT }, cause);
    expect(err).toMatchObject({
      currentMessage: msg1,
      cause,
      info: {
        msg1,
        msg2,
        level: 'warn',
        status: HttpStatus.CONFLICT,
      },
    });
  });
});
