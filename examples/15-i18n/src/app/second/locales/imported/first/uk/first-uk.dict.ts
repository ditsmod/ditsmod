import { ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ts-stack/di';

import { FirstDict } from '@dict/first/first.dict';

@injectable()
export class FirstUkDict extends FirstDict {
  override getLng(): ISO639 {
    return 'uk';
  }
  /**
   * один, два, три
   */
  override countToThree = `extended: один, два, три`;
}
