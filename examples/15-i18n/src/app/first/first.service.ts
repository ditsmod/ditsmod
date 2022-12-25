import { injectable } from '@ts-stack/di';
import { DictService } from '@ditsmod/i18n';

import { FirstDict } from '@dict/first/first.dict';

@injectable()
export class FirstService {
  constructor(private dictService: DictService) {}

  countToThree() {
    const dict = this.dictService.getDictionary(FirstDict);
    return dict.countToThree;
  }
}
