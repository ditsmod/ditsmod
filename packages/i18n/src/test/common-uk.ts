import { Injectable } from '@ts-stack/di';

import { ISO639 } from '../types/iso-639';
import { Common } from './common-en';

@Injectable()
export class CommonUk extends Common {
  override getLng(): ISO639 {
    return 'uk';
  }

  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
