import { LogMediator, LogFilter } from '@ditsmod/core';

export class SomeLogMediator extends LogMediator {
  /**
   * SomeLogMediator with someNewMethod says: "${additionalArgument}".
   */
  someNewMethod(self: object, additionalArgument: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('info', logFilter, `SomeLogMediator with someNewMethod says: "${additionalArgument}"`);
  }
}
