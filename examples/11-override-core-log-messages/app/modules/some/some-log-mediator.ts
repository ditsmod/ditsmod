import { LogMediator, FilterConfig } from '@ditsmod/core';

export class SomeLogMediator extends LogMediator {
  /**
   * SomeLogMediator with someNewMethod says: "${additionalArgument}".
   */
  someNewMethod(self: object, additionalArgument: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('info', filterConfig, `SomeLogMediator with someNewMethod says: "${additionalArgument}"`);
  }
}
