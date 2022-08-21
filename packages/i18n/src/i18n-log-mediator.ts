import { FilterConfig, LogMediator } from '@ditsmod/core';

export class I18nLogMediator extends LogMediator {
  /**
   * ${className}: I18nExtension did not found translation.
   */
   notFoundTranslation(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('warn', filterConfig, `${className}: I18nExtension did not found translation`);
  }
  /**
   * ${className}: locales were found: [${paths.join(', ')}] in "${localesPath}".
   */
   followingLocalesFound(self: object, localesPath: string, paths: string[]) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    const msg = `${className}: locales were found: [${paths.join(', ')}] in "${localesPath}"`;
    this.setLog('debug', filterConfig, msg);
  }
}