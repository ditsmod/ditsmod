import { ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ditsmod/core';

import { SecondDict } from '#app/second/i18n/current/_base-en/second.dict.js';

@injectable()
export class CommonDictUk extends SecondDict {
  override getLng(): ISO639 {
    return 'uk';
  }

  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
