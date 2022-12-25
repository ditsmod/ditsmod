import { FirstDict } from '@dict/first/first.dict';
import { ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ts-stack/di';

@injectable()
export class FirstPlDict extends FirstDict {
  override getLng(): ISO639 {
    return 'pl';
  }
  /**
   * nie, dwa, trzy
   */
  override countToThree = 'nie, dwa, trzy';
}
