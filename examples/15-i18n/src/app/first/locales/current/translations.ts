import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { CommonDict } from '@dict/first/common.dict';
import { CommonPlDict } from './pl/common.dict';

export const current: DictGroup[] = [
  getDictGroup(CommonDict, CommonPlDict),
];
