import { Dictionary, ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ditsmod/core';

@injectable()
export class FirstDict implements Dictionary {
  getLng(): ISO639 {
    return 'en';
  }
  /**
   * one, two, three
   */
   countToThree = 'one, two, three';
}
