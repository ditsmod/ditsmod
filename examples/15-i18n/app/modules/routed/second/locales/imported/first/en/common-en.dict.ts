import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';
import { CommonDict } from '../../../../../../service/first/locales/current/en/common.dict';

@Injectable()
export class CommonEnDict extends CommonDict {
  override lng: ISO639 = 'en';
  /**
   * one, two, three
   */
   override countToThree = 'four, five, six';
}
