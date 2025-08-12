import { injectable } from '@ditsmod/core';
import { ISO639 } from './types/iso-639.js';

@injectable()
export class I18nErrorMediator {
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
    throw new Error('Token for a dictionary must be defined.');
  }
}
