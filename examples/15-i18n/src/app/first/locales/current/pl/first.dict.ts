import { ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ditsmod/core';

import { FirstDict } from '@dict/first/first.dict';

@injectable()
export class FirstPlDict extends FirstDict {
  override getLng(): ISO639 {
    return 'pl';
  }
  /**
   * nie, dwa, trzy
   */
  override countToThree = 'nie, dwa, trzy';
}
