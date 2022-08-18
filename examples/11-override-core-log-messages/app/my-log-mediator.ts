import { LogMediator, FilterConfig } from '@ditsmod/core';

export class MyLogMediator extends LogMediator {
  /**
   * Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('info', filterConfig, `Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"`);
  }
  /**
   * MyLogMediator with newMethod says: "${additionalArgument}".
   */
  newMethod(self: object, additionalArgument: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('info', filterConfig, `MyLogMediator with newMethod says: "${additionalArgument}"`);
  }
}
