import { MsgLogFilter } from '@ditsmod/core';

import { SomeLogMediator } from '../some/some-log-mediator';

export class OtherLogMediator extends SomeLogMediator {
  /**
   * OtherLogMediator with overrided someNewMethod says: "${additionalArgument}".
   */
  override someNewMethod(self: object, additionalArgument: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('info', msgLogFilter, `OtherLogMediator with overrided someNewMethod says: "${additionalArgument}"`);
  }
}
