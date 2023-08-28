import { injectable } from '@ditsmod/core';
import { DictService } from '@ditsmod/i18n';

import { FirstDict } from '#dict/first/first.dict.js';

@injectable()
export class FirstService {
  constructor(private dictService: DictService) {}

  countToThree() {
    const dict = this.dictService.getDictionary(FirstDict);
    return dict.countToThree;
  }
}
