import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { ErrorsDict } from '@dict/second/errors.dict';

@Injectable()
export class ErrorsUkDict extends ErrorsDict {
  override lng: ISO639 = 'uk';
  /**
   * Can't connect to ${database}.
   */
   override mysqlConnect(database: string) {
    return `Can't connect to ${database}` as const;
  }
}
