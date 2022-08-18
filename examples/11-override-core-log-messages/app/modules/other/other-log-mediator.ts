import { FilterConfig } from '@ditsmod/core';

import { SomeLogMediator } from '../some/some-log-mediator';

export class OtherLogMediator extends SomeLogMediator {
  /**
   * OtherLogMediator with overrided someNewMethod says: "${additionalArgument}".
   */
  override someNewMethod(self: object, additionalArgument: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('info', filterConfig, `OtherLogMediator with overrided someNewMethod says: "${additionalArgument}"`);
  }
}
