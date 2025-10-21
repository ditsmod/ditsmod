import { ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ditsmod/core';

import { FirstDict } from '#dict/first/first.dict.js';

@injectable()
export class FirstDictPl extends FirstDict {
  override getLng(): ISO639 {
    return 'pl';
  }
  /**
   * nie, dwa, trzy
   */
  override countToThree = 'nie, dwa, trzy';
}
