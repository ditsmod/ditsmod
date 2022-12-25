import { Dictionary, ISO639 } from '@ditsmod/i18n';
import { injectable } from '@ts-stack/di';

@injectable()
export class SecondDict implements Dictionary {
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
