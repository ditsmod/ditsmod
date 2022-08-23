import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { CommonDict } from '@dict/first/common.dict';

@Injectable()
export class CommonEnDict extends CommonDict {
  override lng: ISO639 = 'en';
  /**
   * one, two, three
   */
  override countToThree = 'four, five, six';
}
