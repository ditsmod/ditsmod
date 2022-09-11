import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { FirstDict } from '@dict/first/first.dict';
import { FirstEnDict } from './first/en/first-en.dict';
import { FirstUkDict } from './first/uk/first-uk.dict';

export const imported: DictGroup[] = [
  getDictGroup(FirstDict, FirstEnDict, FirstUkDict)
];
