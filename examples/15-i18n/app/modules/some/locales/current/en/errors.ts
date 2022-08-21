import { I18nTranslation } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class Errors implements I18nTranslation {
  lng = 'en';
  /**
   * Can't connect to ${database}.
   */
  mysqlConnect(database: string) {
    return `Can't connect to ${database}`;
  }
}
