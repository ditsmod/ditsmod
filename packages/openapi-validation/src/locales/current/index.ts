import { DictGroup } from '@ditsmod/i18n';

import { AssertDict } from './_base-en/assert.dict';
import { AssertUkDict } from './uk/assert.dict';

export { AssertUkDict };
export { AssertDict };

export const current: DictGroup[] = [
  [AssertDict, AssertUkDict],
];
