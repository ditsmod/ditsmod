import { CustomError } from '@ditsmod/core';
import { ISO639 } from './types/iso-639.js';

export const i18nErrors = {
  /**
   * Dictionary "${tokenName}" not found for lng "${lng}"
   */
  dictionaryNotFound(tokenName: string, lng: ISO639) {
    return new CustomError({
      code: i18nErrors.dictionaryNotFound.name,
      msg1: `Dictionary "${tokenName}" not found for lng "${lng}"`,
      level: 'fatal',
    });
  },
  /**
   * Token for a dictionary must be defined.
   */
  dictionaryMustBeDefined() {
    return new CustomError({
      code: i18nErrors.dictionaryMustBeDefined.name,
      msg1: 'Token for a dictionary must be defined.',
      level: 'fatal',
    });
  },
};
