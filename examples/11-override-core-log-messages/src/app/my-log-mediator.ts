import { SystemLogMediator } from '@ditsmod/core';

export class MyLogMediator extends SystemLogMediator {
  /**
   * Custom message: here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, host: string, port: number) {
    this.setLog('info', `Custom message: here host: "${host}", and here port: "${port}"`);
  }
}
