import { Dictionary, ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class CommonPlDict implements Dictionary {
  getLng(): ISO639 {
    return 'pl';
  }
  /**
   * nie, dwa, trzy
   */
   countToThree = 'nie, dwa, trzy';
}
