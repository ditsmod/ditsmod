import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { Common } from '../en/common';

@Injectable()
export class CommonUk extends Common {
  override lng: ISO639 = 'uk';

  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
