import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { FirstDict } from '@dict/first/first.dict';
import { FirstPlDict } from './pl/first.dict';
export { FirstDict };

export const current: DictGroup[] = [
  getDictGroup(FirstDict, FirstPlDict),
];
