import { I18nTranslation, ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class Common implements I18nTranslation {
  lng: ISO639 = 'en';
  /**
   * Hi, there!
   */
  hi() {
    return `Hi, there!`;
  }
  /**
   * Hello, ${name}!
   */
  hello(name: string) {
    return `Hello, ${name}!`;
  }
}
