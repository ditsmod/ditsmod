import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { FirstDict } from '#dict/first/first.dict.js';
import { FirstDictEn } from './first/en/first.dict-en.js';
import { FirstDictUk } from './first/uk/first.dict-uk.js';

export const imported: DictGroup[] = [
  getDictGroup(FirstDict, FirstDictEn, FirstDictUk)
];
