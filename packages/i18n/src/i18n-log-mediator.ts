import { MsgLogFilter, LogMediator } from '@ditsmod/core';
import { ISO639 } from './types/iso-639';

export class I18nLogMediator extends LogMediator {
  /**
   * ${className}: in ${moduleName} translation not found.
   */
  translationNotFound(self: object, moduleName: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('warn', msgLogFilter, `${className}: in ${moduleName} translation not found.`);
  }
  /**
   * ${className}: in ${extendedClassName} missing methods: [${methods}].
   */
  missingMethods(self: object, extendedClassName: string, missingMethods: string[]) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const methods = missingMethods.join(', ');
    this.setLog('debug', msgLogFilter, `${className}: in ${extendedClassName} missing methods: [${methods}].`);
  }
  /**
   * ${className}: in ${dictName} missing locale "${lng}".
   */
  missingLng(self: object, dictName: string, lng: ISO639) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    this.setLog('debug', msgLogFilter, `${className}: in ${dictName} missing locale "${lng}".`);
  }
  /**
   * ${className}: in "${path}" found locales: [${allLngs.join(', ')}]. Some methods: [${methods.join(', ')}].
   */
  foundLngs(self: object, tokenName: string, allLngs: string[], methods: string[], methodName?: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const path = methodName ? `${methodName} -> ${tokenName}` : `${tokenName}`;
    let msg = `${className}: in "${path}" found locales: [${allLngs.join(', ')}].`;
    if (methods.length) {
      msg += ` Some methods: [${methods.join(', ')}].`;
    } else {
      msg += ` No methods found.`;
    }
    this.setLog('debug', msgLogFilter, msg);
  }
  /**
   * ${className}: found overrides in "${path}" for locales: [${allLngs.join(', ')}]. Some methods: [${methods.join(', ')}].
   */
  overridedLngs(self: object, tokenName: string, allLngs: string[], methods: string[], methodName?: string) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesName = className;
    const path = methodName ? `${methodName} -> ${tokenName}` : `${tokenName}`;
    let msg = `${className}: found overrides in "${path}" for locales: [${allLngs.join(', ')}].`;
    if (methods.length) {
      msg += ` Some methods: [${methods.join(', ')}].`;
    } else {
      msg += ` No methods found.`;
    }
    this.setLog('debug', msgLogFilter, msg);
  }
}
