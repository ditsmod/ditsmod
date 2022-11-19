import { SystemLogMediator, InputLogFilter } from '@ditsmod/core';

export class MyLogMediator extends SystemLogMediator {
  /**
   * Here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, host: string, port: number) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    this.setLog('info', inputLogFilter, `Here host: "${host}", and here port: "${port}"`);
  }
}
