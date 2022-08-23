import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { CommonDict } from '@dict/second/common.dict';

@Injectable()
export class CommonUkDict extends CommonDict {
  override lng: ISO639 = 'uk';

  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
