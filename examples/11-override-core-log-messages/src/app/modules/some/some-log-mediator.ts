import { LogMediator, InputLogFilter } from '@ditsmod/core';

export class SomeLogMediator extends LogMediator {
  /**
   * SomeLogMediator with someNewMethod says: "${additionalArgument}".
   */
  someNewMethod(self: object, additionalArgument: string) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    this.setLog('info', inputLogFilter, `SomeLogMediator with someNewMethod says: "${additionalArgument}"`);
  }
}
