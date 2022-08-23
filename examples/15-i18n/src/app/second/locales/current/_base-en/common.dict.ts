import { Dictionary, ISO639 } from '@ditsmod/i18n';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class CommonDict implements Dictionary {
  getLng(): ISO639 {
    return 'en';
  }
  /**
   * Hi, there!
   */
  hi = `Hi, there!`;
  /**
   * Hello, ${name}!
   */
  hello(name: string) {
    return `Hello, ${name}!`;
  }
}
