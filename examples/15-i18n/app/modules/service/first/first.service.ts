import { Injectable } from '@ts-stack/di';
import { I18nService } from '@ditsmod/i18n';

import { CommonDict } from './locales/current/en/common.dict';

@Injectable()
export class FirstService {
  constructor(private i18nService: I18nService) {}

  countToThree() {
    const dict = this.i18nService.getDictionary(CommonDict);
    return dict.countToThree();
  }
}
