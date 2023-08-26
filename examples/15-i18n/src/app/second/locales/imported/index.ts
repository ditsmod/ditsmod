import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { FirstDict } from '@dict/first/first.dict.js';
import { FirstEnDict } from './first/en/first-en.dict.js';
import { FirstUkDict } from './first/uk/first-uk.dict.js';

export const imported: DictGroup[] = [
  getDictGroup(FirstDict, FirstEnDict, FirstUkDict)
];
