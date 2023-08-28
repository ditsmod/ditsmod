import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { SecondDict } from '#dict/second/second.dict.js';
import { CommonUkDict } from './uk/second-uk.dict.js';
import { ErrorsDict } from '#dict/second/errors.dict.js';
import { ErrorsUkDict } from './uk/errors-uk.dict.js';

export { SecondDict, ErrorsDict };

export const current: DictGroup[] = [
  getDictGroup(SecondDict, CommonUkDict),
  getDictGroup(ErrorsDict, ErrorsUkDict),
];
