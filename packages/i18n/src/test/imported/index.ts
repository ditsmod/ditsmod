import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { CommonDict } from '../current';
import { CommonEnDict } from './common-en.dict';
import { CommonPlDict } from './common-pl.dict';
import { CommonUkDict } from './common-uk.dict';

export const current: DictGroup[] = [
  getDictGroup(CommonDict, CommonEnDict, CommonUkDict, CommonPlDict),
];