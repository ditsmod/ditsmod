import { InputLogFilter } from '@ditsmod/core';

import { SomeLogMediator } from '../some/some-log-mediator';

export class OtherLogMediator extends SomeLogMediator {
  /**
   * OtherLogMediator with overrided someNewMethod says: "${additionalArgument}".
   */
  override someNewMethod(self: object, additionalArgument: string) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    this.setLog('info', inputLogFilter, `OtherLogMediator with overrided someNewMethod says: "${additionalArgument}"`);
  }
}
