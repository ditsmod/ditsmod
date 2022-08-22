import { FilterConfig, LogMediator } from '@ditsmod/core';

export class I18nLogMediator extends LogMediator {
  /**
   * ${className}: in ${moduleName} translation not found.
   */
  translationNotFound(self: object, moduleName: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('warn', filterConfig, `${className}: in ${moduleName} translation not found.`);
  }
  /**
   * ${className}: wrong translation for ${moduleName}.
   */
  wrongTranslation(self: object, moduleName: string) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('warn', filterConfig, `${className}: wrong translation for ${moduleName}.`);
  }
  /**
   * ${className}: in ${extendedClassName} missing methods: [${methods}].
   */
  missingMethods(self: object, extendedClassName: string, missingMethods: string[]) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const methods = missingMethods.join(', ');
    this.setLog('debug', filterConfig, `${className}: in ${extendedClassName} missing methods: [${methods}].`);
  }
}
