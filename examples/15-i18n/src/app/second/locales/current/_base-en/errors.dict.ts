import { Dictionary, ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class ErrorsDict implements Dictionary {
  lng: ISO639 = 'en';
  /**
   * Can't connect to ${database}.
   */
  mysqlConnect(database: string) {
    return `Can't connect to ${database}`;
  }
}
