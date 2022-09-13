import { FirstDict } from '@dict/first/first.dict';
import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class FirstPlDict extends FirstDict {
  override getLng(): ISO639 {
    return 'pl';
  }
  /**
   * nie, dwa, trzy
   */
  override countToThree = 'nie, dwa, trzy';
}
