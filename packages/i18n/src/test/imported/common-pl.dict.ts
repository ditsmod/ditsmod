import { Injectable } from '@ts-stack/di';

import { ISO639 } from '../../types/iso-639';
import { CommonDict } from '../current/common-en.dict';

@Injectable()
export class CommonPlDict extends CommonDict {
  override getLng(): ISO639 {
    return 'pl';
  }

  override hello(name: string) {
    return `extended: Witam, ${name}!`;
  }
}
