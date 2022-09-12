import { DictGroup, getDictGroup } from '@ditsmod/i18n';
import { AssertDict } from '@ditsmod/openapi-validation';

import { AssertPlDict } from './openapi-validation/pl/assert.dict';

export const imported: DictGroup[] = [
  getDictGroup(AssertDict, AssertPlDict),
];