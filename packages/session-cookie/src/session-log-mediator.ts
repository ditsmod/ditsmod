import { LogMediator } from '@ditsmod/core';

export class SessionLogMediator extends LogMediator {
  /**
   * `you cannot set opts.expires and opts.maxAge at the same time. For now, opts.maxAge will be ignored.`
   */
  cannotSetExpireAndMaxAge(self: object) {
    const className = self.constructor.name;
    const msg = `${className}: you cannot set opts.expires and opts.maxAge at the same time. For now, opts.maxAge will be ignored.`;
    this.setLog('warn', msg);
  }
}
