import { ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

import { SecondDict } from '@dict/second/second.dict';

@Injectable()
export class CommonUkDict extends SecondDict {
  override getLng(): ISO639 {
    return 'uk';
  }

  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
