import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { Errors } from '../en/errors';

@Injectable()
export class ErrorsUk extends Errors {
  override lng: ISO639 = 'uk';
  /**
   * Can't connect to ${database}.
   */
   override mysqlConnect(database: string) {
    return `Can't connect to ${database}` as const;
  }
}
