import { injectable } from '@ditsmod/core';

import { ISO639 } from '#types/iso-639.js';
import { CommonDict } from '../current/common-en.dict.js';

@injectable()
export class CommonUkDict extends CommonDict {
  override getLng(): ISO639 {
    return 'uk';
  }

  override hello(name: string) {
    return `overrided: Привіт, ${name}!`;
  }
}
