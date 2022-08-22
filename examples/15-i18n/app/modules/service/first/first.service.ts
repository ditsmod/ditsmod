import { Injectable } from '@ts-stack/di';
import { I18nService } from '@ditsmod/i18n';

import { Common } from './locales/current/en/common';

@Injectable()
export class FirstService {
  constructor(private i18nService: I18nService) {}

  countToThree() {
    const dict = this.i18nService.getDictionary(Common);
    return dict.countToThree();
  }
}
