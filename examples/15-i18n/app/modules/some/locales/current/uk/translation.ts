import { Injectable } from '@ts-stack/di';

import { TranslationDefault } from '../en/translation';

@Injectable()
export class TranslationUk extends TranslationDefault {
  override lng = 'uk';
  /**
   * Привіт, ${name}!
   */
  override hello(name: string) {
    console.log('called');
    return `Привіт, ${name}!`;
  }
}
