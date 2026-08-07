import { ISO639 } from '@holu/i18n';
import { injectable } from '@holu/core';

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
