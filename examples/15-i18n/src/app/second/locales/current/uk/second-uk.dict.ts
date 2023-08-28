import { ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ditsmod/core';

import { SecondDict } from '#dict/second/second.dict.js';

@injectable()
export class CommonUkDict extends SecondDict {
  override getLng(): ISO639 {
    return 'uk';
  }

  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
