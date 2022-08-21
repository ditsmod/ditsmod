import { Injectable } from '@ts-stack/di';

import { Common } from '../en/common';

@Injectable()
export class CommonUk extends Common {
  override lng = 'uk';

  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
