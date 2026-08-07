import { Dictionary, ISO639 } from '@holu/i18n';
import { injectable } from '@holu/core';

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
