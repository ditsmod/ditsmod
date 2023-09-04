import { SystemLogMediator } from '@ditsmod/core';

export class MyLogMediator extends SystemLogMediator {
  /**
   * Here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, host: string, port: number) {
    this.setLog('info', `Here host: "${host}", and here port: "${port}"`);
  }
}
