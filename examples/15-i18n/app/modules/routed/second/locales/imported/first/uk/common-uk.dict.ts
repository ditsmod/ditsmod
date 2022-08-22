import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { CommonEnDict } from '../en/common-en.dict';

@Injectable()
export class CommonUkDict extends CommonEnDict {
  override lng: ISO639 = 'uk';
  /**
   * one, two, three
   */
  override countToThree = `чотири, п'ять, шість`;
}
