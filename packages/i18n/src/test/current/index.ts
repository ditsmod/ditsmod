import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { CommonDict } from './common-en.dict';
import { CommonUkDict } from './common-uk.dict';
export { CommonDict };

export const current: DictGroup[] = [
  getDictGroup(CommonDict, CommonUkDict),
];
