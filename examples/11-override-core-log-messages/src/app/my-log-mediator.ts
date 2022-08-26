import { LogMediator, MsgLogFilter } from '@ditsmod/core';

export class MyLogMediator extends LogMediator {
  /**
   * Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('info', msgLogFilter, `Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"`);
  }
}
