import { LogMediator, MsgLogFilter } from '@ditsmod/core';

export class SomeLogMediator extends LogMediator {
  /**
   * SomeLogMediator with someNewMethod says: "${additionalArgument}".
   */
  someNewMethod(self: object, additionalArgument: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('info', msgLogFilter, `SomeLogMediator with someNewMethod says: "${additionalArgument}"`);
  }
}
