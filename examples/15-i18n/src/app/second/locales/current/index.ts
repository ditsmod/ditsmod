import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { CommonDict } from '@dict/second/common.dict';
import { ErrorsDict } from '@dict/second/errors.dict';
import { CommonUkDict } from './uk/common-uk.dict';
import { ErrorsUkDict } from './uk/errors-uk.dict';

export const current: DictGroup[] = [
  getDictGroup(CommonDict, CommonUkDict),
  getDictGroup(ErrorsDict, ErrorsUkDict),
];
