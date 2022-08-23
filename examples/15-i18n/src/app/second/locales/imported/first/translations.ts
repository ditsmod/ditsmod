import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { CommonDict } from '@dict/first/common.dict';
import { CommonEnDict } from './en/common-en.dict';
import { CommonUkDict } from './uk/common-uk.dict';

export const importedTranslations: DictGroup[] = [
  getDictGroup(CommonDict, CommonEnDict, CommonUkDict),
];
