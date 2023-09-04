import { LogMediator } from '@ditsmod/core';

export class SomeLogMediator extends LogMediator {
  /**
   * SomeLogMediator with someNewMethod says: "${additionalArgument}".
   */
  someNewMethod(self: object, additionalArgument: string) {
    this.setLog('info', `SomeLogMediator with someNewMethod says: "${additionalArgument}"`);
  }
}
