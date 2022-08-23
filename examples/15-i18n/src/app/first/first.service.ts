import { Injectable } from '@ts-stack/di';
import { DictService } from '@ditsmod/i18n';

import { CommonDict } from '@dict/first/common.dict';

@Injectable()
export class FirstService {
  constructor(private i18nService: DictService) {}

  countToThree() {
    const dict = this.i18nService.getDictionary(CommonDict);
    return dict.countToThree;
  }
}
