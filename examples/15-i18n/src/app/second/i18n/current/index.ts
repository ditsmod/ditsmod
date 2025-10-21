import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { SecondDict } from '#app/second/i18n/current/_base-en/second.dict.js';
import { CommonDictUk } from './uk/second.dict-uk.js';
import { ErrorsDict } from '#app/second/i18n/current/_base-en/errors.dict.js';
import { ErrorsDictUk } from './uk/errors.dict-uk.js';

export { SecondDict, ErrorsDict };

export const current: DictGroup[] = [
  getDictGroup(SecondDict, CommonDictUk),
  getDictGroup(ErrorsDict, ErrorsDictUk),
];
