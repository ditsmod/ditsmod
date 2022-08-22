import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { CommonEn } from '../en/common';

@Injectable()
export class CommonUk extends CommonEn {
  override lng: ISO639 = 'uk';
  /**
   * one, two, three
   */
  override countToThree() {
    return `чотири, п'ять, шість`;
  }
}
