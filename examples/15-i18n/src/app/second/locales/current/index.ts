import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { SecondDict } from '@dict/second/second.dict';
import { CommonUkDict } from './uk/second-uk.dict';
import { ErrorsDict } from '@dict/second/errors.dict';
import { ErrorsUkDict } from './uk/errors-uk.dict';

export { SecondDict, ErrorsDict };

export const current: DictGroup[] = [
  getDictGroup(SecondDict, CommonUkDict),
  getDictGroup(ErrorsDict, ErrorsUkDict),
];
