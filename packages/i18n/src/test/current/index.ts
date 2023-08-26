import { getDictGroup } from '../../i18n-providers.js';
import { DictGroup } from '../../types/mix.js';
import { CommonDict } from './common-en.dict.js';
import { CommonUkDict } from './common-uk.dict.js';
export { CommonDict };

export const current: DictGroup[] = [
  getDictGroup(CommonDict, CommonUkDict),
];
