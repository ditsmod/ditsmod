import { SystemLogMediator, MsgLogFilter } from '@ditsmod/core';

export class MyLogMediator extends SystemLogMediator {
  /**
   * Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, host: string, port: number) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.className = className;
    this.setLog('info', msgLogFilter, `Here host: "${host}", and here port: "${port}"`);
  }
}
