import { Dictionary, ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ts-stack/di';

@injectable()
export class ErrorsDict implements Dictionary {
  getLng(): ISO639 {
    return 'en';
  }
  /**
   * Can't connect to ${database}.
   */
  mysqlConnect(database: string) {
    return `Can't connect to ${database}`;
  }
}
