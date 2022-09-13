import { Injectable } from '@ts-stack/di';

import { ISO639 } from '../../types/iso-639';
import { CommonDict } from './common-en.dict';

@Injectable()
export class CommonUkDict extends CommonDict {
  override getLng(): ISO639 {
    return 'uk';
  }

  override hello(name: string) {
    return `Привіт, ${name}!`;
  }
}
