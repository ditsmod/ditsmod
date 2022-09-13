import { Injectable } from '@ts-stack/di';

import { ISO639 } from '../../types/iso-639';
import { CommonDict } from '../current/common-en.dict';

@Injectable()
export class CommonEnDict extends CommonDict {
  override getLng(): ISO639 {
    return 'en';
  }
  /**
   * Hi, there!
   */
  override hi() {
    return `overrided: Hi, there!`;
  }
  /**
   * Hello, ${name}!
   */
  override hello(name: string) {
    return `overrided: Hello, ${name}!`;
  }
}
