import { I18nDictionary, ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class CommonDict implements I18nDictionary {
  lng: ISO639 = 'en';
  /**
   * one, two, three
   */
   countToThree = 'one, two, three';
}
