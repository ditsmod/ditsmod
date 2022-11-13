import { InputLogFilter, LogMediator } from '@ditsmod/core';

import { ISO639 } from './types/iso-639';

export class I18nLogMediator extends LogMediator {
  /**
   * className: in ${moduleName} translation not found.
   */
  translationNotFound(self: object) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    inputLogFilter.tags = ['i18n'];
    this.setLog('warn', inputLogFilter, `${className}: in ${this.moduleExtract.moduleName} translation not found.`);
  }
  /**
   * className: in ${extendedClassName} missing methods: [${methods}].
   */
  missingMethods(self: object, extendedClassName: string, missingMethods: string[]) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    inputLogFilter.tags = ['i18n'];
    const methods = missingMethods.join(', ');
    this.setLog('debug', inputLogFilter, `${className}: in ${extendedClassName} missing methods: [${methods}].`);
  }
  /**
   * className: in ${dictName} missing locale "${lng}".
   */
  missingLng(self: object, dictName: string, lng: ISO639) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    inputLogFilter.tags = ['i18n'];
    this.setLog('debug', inputLogFilter, `${className}: in ${dictName} missing locale "${lng}".`);
  }
  /**
   * className: for tokenName found locales: [...].
   */
  foundLngs(self: object, tokenName: string, allLngs: string[]) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    inputLogFilter.tags = ['i18n'];
    const msg = `${className}: for ${tokenName} found locales: [${allLngs.join(', ')}].`;
    this.setLog('debug', inputLogFilter, msg);
  }
  /**
   * className: for tokenName found extended dictionaries for locales: [...].
   */
  overridedLngs(self: object, tokenName: string, allLngs: string[]) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    inputLogFilter.tags = ['i18n', 'i18n-extends'];
    const msg = `${className}: for ${tokenName} found extended dictionaries for locales: [${allLngs.join(', ')}].`;
    this.setLog('debug', inputLogFilter, msg);
  }
  /**
   * Dictionary "${tokenName}" not found for lng "${lng}"
   */
  throwDictionaryNotFound(tokenName: string, lng: ISO639) {
    throw new Error(`Dictionary "${tokenName}" not found for lng "${lng}"`);
  }
  /**
   * Token for a dictionary must be defined.
   */
  throwDictionaryMustBeDefined() {
    throw new Error(`Token for a dictionary must be defined.`);
  }
}
