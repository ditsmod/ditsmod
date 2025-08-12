import { CustomError, injectable } from '@ditsmod/core';
import { ISO639 } from './types/iso-639.js';

@injectable()
export class I18nErrorMediator {
  /**
   * Dictionary "${tokenName}" not found for lng "${lng}"
   */
  static dictionaryNotFound(tokenName: string, lng: ISO639) {
    return new CustomError({
      code: I18nErrorMediator.dictionaryNotFound.name,
      msg1: `Dictionary "${tokenName}" not found for lng "${lng}"`,
      level: 'fatal',
    });
  }
  /**
   * Token for a dictionary must be defined.
   */
  static dictionaryMustBeDefined() {
    return new CustomError({
      code: I18nErrorMediator.dictionaryMustBeDefined.name,
      msg1: 'Token for a dictionary must be defined.',
      level: 'fatal',
    });
  }
}
