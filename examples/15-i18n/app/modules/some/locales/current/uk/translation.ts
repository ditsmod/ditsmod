import { Injectable } from '@ts-stack/di';

import { TranslationDefault } from '../en/translation';

@Injectable()
export class TranslationUk extends TranslationDefault {
  override lng = 'uk';
  /**
   * Привіт, ${name}!
   */
  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
