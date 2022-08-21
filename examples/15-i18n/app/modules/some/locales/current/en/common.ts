import { I18nTranslation } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class Common implements I18nTranslation {
  lng = 'en';
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
