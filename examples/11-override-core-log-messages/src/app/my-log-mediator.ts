import { LogMediator, LogFilter } from '@ditsmod/core';

export class MyLogMediator extends LogMediator {
  /**
   * Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const logFilter = new LogFilter();
    logFilter.classesNames = [className];
    this.setLog('info', logFilter, `Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"`);
  }
}
