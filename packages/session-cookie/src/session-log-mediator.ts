import { LogMediator, InputLogFilter } from '@ditsmod/core';

export class SessionLogMediator extends LogMediator {
  cannotSetExpireAndMaxAge(self: object) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    inputLogFilter.tags = ['session-cookie'];
    const msg = `${className}: you cannot set opts.expires and opts.maxAge at the same time. For now, opts.maxAge will be ignored.`;
    this.setLog('warn', inputLogFilter, msg);
  }
}
