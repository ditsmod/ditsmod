import { FilterConfig, LogMediator } from '@ditsmod/core';

export class I18nLogMediator extends LogMediator {
  /**
   * ${className}: translation not found for ${namespace.constructor.name}.${lng}.
   */
  notFoundTranslation(self: object) {
    const className = self.constructor.name;
    const filterConfig = new FilterConfig();
    filterConfig.classesNames = [className];
    this.setLog('debug', filterConfig, `${className}: translation not found`);
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
