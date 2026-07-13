import { Reflector } from '@ditsmod/core/di';

export const timeout = Reflector.makePropDecorator((nameOrTimeout: string | number, timeout?: number) => {
  const [name, ms] = typeof nameOrTimeout === 'string' ? [nameOrTimeout, timeout!] : [undefined, nameOrTimeout];
  return { name, timeout: ms };
});
export type TimeoutDecorator = typeof timeout;
