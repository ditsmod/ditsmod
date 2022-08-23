import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { CommonDict } from '@dict/first/common.dict';

@Injectable()
export class CommonUkDict extends CommonDict {
  override lng: ISO639 = 'uk';
  /**
   * one, two, three
   */
  override countToThree = `чотири, п'ять, шість`;
}
