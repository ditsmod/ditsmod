import { ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ditsmod/core';

import { FirstDict } from '#dict/first/first.dict.js';

@injectable()
export class FirstDictUk extends FirstDict {
  override getLng(): ISO639 {
    return 'uk';
  }
  /**
   * overrided: один, два, три
   */
  override countToThree = 'overrided: один, два, три';
}
