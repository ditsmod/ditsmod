import { getDictGroup } from '../../i18n-providers';
import { DictGroup } from '../../types/mix';
import { CommonDict } from './common-en.dict';
import { CommonUkDict } from './common-uk.dict';
export { CommonDict };

export const current: DictGroup[] = [
  getDictGroup(CommonDict, CommonUkDict),
];
