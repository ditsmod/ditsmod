import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';
import { Common } from '../../../../../../service/first/locales/current/en/common';

@Injectable()
export class CommonEn extends Common {
  override lng: ISO639 = 'en';
  /**
   * one, two, three
   */
   override countToThree() {
    return `four, five, six`;
  }
}
