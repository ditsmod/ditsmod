import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { FirstDict } from '@dict/first/first.dict.js';
import { FirstPlDict } from './pl/first.dict.js';
export { FirstDict };

export const current: DictGroup[] = [
  getDictGroup(FirstDict, FirstPlDict),
];
