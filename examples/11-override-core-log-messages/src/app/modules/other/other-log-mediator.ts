import { LogFilter } from '@ditsmod/core';

import { SomeLogMediator } from '../some/some-log-mediator';

export class OtherLogMediator extends SomeLogMediator {
  /**
   * OtherLogMediator with overrided someNewMethod says: "${additionalArgument}".
   */
  override someNewMethod(self: object, additionalArgument: string) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('info', logFilter, `OtherLogMediator with overrided someNewMethod says: "${additionalArgument}"`);
  }
}
