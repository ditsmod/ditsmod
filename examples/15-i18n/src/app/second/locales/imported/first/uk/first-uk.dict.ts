import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { FirstDict } from '@dict/first/first.dict';

@Injectable()
export class FirstUkDict extends FirstDict {
  override getLng(): ISO639 {
    return 'uk';
  }
  /**
   * один, два, три
   */
  override countToThree = `extended: один, два, три`;
}
