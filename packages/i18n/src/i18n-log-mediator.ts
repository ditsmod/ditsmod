import { injectable, LogMediator } from '@ditsmod/core';

import { ISO639 } from './types/iso-639.js';

@injectable()
export class I18nLogMediator extends LogMediator {
  /**
   * className: in ${moduleName} translation not found.
   */
  translationNotFound(self: object) {
    const className = self.constructor.name;
    this.setLog('warn', `${className}: in ${this.moduleExtract.moduleName} translation not found.`);
  }
  /**
   * className: in ${extendedClassName} missing methods: [${methods}].
   */
  missingMethods(self: object, extendedClassName: string, missingMethods: string[]) {
    const className = self.constructor.name;
    const methods = missingMethods.join(', ');
    this.setLog('debug', `${className}: in ${extendedClassName} missing methods: [${methods}].`);
  }
  /**
   * className: in ${dictName} missing locale "${lng}".
   */
  missingLng(self: object, dictName: string, lng: ISO639) {
    const className = self.constructor.name;
    this.setLog('debug', `${className}: in ${dictName} missing locale "${lng}".`);
  }
  /**
   * className: for tokenName found locales: [...].
   */
  foundLngs(self: object, tokenName: string, allLngs: string[]) {
    const className = self.constructor.name;
    const msg = `${className}: for ${tokenName} found locales: [${allLngs.join(', ')}].`;
    this.setLog('debug', msg);
  }
  /**
   * className: for tokenName found extended dictionaries for locales: [...].
   */
  overridedLngs(self: object, tokenName: string, allLngs: string[]) {
    const className = self.constructor.name;
    const msg = `${className}: for ${tokenName} found extended dictionaries for locales: [${allLngs.join(', ')}].`;
    this.setLog('debug', msg);
  }
}
