import { injectable } from '@ts-stack/di';

import { ISO639 } from '../../types/iso-639';
import { CommonDict } from '../current/common-en.dict';

@injectable()
export class CommonUkDict extends CommonDict {
  override getLng(): ISO639 {
    return 'uk';
  }

  override hello(name: string) {
    return `overrided: Привіт, ${name}!`;
  }
}
