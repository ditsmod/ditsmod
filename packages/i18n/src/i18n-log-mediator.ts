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
   * ${className}: in ${extendedClassName} missing methods: [${methods}].
   */
  missingMethods(self: object, extendedClassName: string, missingMethods: string[]) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const methods = missingMethods.join(', ');
    this.setLog('debug', filterConfig, `${className}: in ${extendedClassName} missing methods: [${methods}].`);
  }
  /**
   * ${className}: for dictionary "${tokenName}" found next locales: [${allLngs.join(', ')}]. Some methods: [${methods.join(', ')}].
   */
  currentLngs(self: object, tokenName: string, allLngs: string[], methods: string[]) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    let msg = `${className}: for dictionary "${tokenName}" found next locales: [${allLngs.join(', ')}].`;
    if (methods.length) {
      msg += ` Some methods: [${methods.join(', ')}].`;
    } else {
      msg += ` No methods found.`;
    }
    this.setLog('debug', filterConfig, msg);
  }
  /**
   * ${className}: for overrided imported dictionary "${tokenName}" found next locales: [${allLngs.join(', ')}]. Some methods: [${methods.join(', ')}].
   */
  importsLngs(self: object, tokenName: string, allLngs: string[], methods: string[]) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    let msg = `${className}: for overrided imported dictionary "${tokenName}" found next locales: [${allLngs.join(', ')}].`;
    if (methods.length) {
      msg += ` Some methods: [${methods.join(', ')}].`;
    } else {
      msg += ` No methods found.`;
    }
    this.setLog('debug', filterConfig, msg);
  }
}
