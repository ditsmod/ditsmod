import { Dictionary, ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class FirstDict implements Dictionary {
  getLng(): ISO639 {
    return 'en';
  }
  /**
   * one, two, three
   */
   countToThree = 'one, two, three';
}
