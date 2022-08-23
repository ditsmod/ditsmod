import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { CommonDict } from '@dict/first/common.dict';

@Injectable()
export class CommonUkDict extends CommonDict {
  override getLng(): ISO639 {
    return 'uk';
  }
  /**
   * one, two, three
   */
  override countToThree = `один, два, три`;
}
