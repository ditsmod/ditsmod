import { FilterConfig, LogMediator } from '@ditsmod/core';

export class I18nLogMediator extends LogMediator {
  /**
   * I18nExtension did not detect modulePath in ${moduleName}.
   */
   notDetectModulePath(self: object, moduleName: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('warn', filterConfig, `I18nExtension did not detect modulePath in ${moduleName}`);
  }
}