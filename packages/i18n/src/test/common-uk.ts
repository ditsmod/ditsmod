import { Injectable } from '@ts-stack/di';

import { ISO639 } from '../types/iso-639';
import { Common } from './common-en';

@Injectable()
export class CommonUk extends Common {
  override lng: ISO639 = 'uk';

  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
