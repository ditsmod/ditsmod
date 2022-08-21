import { I18nTranslation } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class TranslationDefault implements I18nTranslation {
  lng = 'en';
  /**
   * Hello, ${name}!
   */
  hello(name: string) {
    return `Hello, ${name}!`;
  }
}
