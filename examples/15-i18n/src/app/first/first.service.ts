import { Injectable } from '@ts-stack/di';
import { DictService } from '@ditsmod/i18n';

import { CommonDict } from '@dict/first/common.dict';

@Injectable()
export class FirstService {
  constructor(private dictService: DictService) {}

  countToThree() {
    const dict = this.dictService.getDictionary(CommonDict);
    return dict.countToThree;
  }
}
