import { Injectable } from '@ts-stack/di';

import { Dictionary } from '../types/mix';
import { ISO639 } from '../types/iso-639';

@Injectable()
export class Common implements Dictionary {
  lng: ISO639 = 'en';
  /**
   * Hi, there!
   */
  hi() {
    return `Hi, there!`;
  }
  /**
   * Hello, ${name}!
   */
  hello(name: string) {
    return `Hello, ${name}!`;
  }
}
