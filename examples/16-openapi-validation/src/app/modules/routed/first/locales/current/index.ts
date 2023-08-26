import { DictGroup, getDictGroup } from '@ditsmod/i18n';

import { OpenapiUkModelsDict } from './uk/openapi-models.dict.js';
import { OpenapiModelsDict } from './_base-en/openapi-models.dict.js';

export { OpenapiModelsDict };

export const current: DictGroup[] = [
  getDictGroup(OpenapiModelsDict, OpenapiUkModelsDict)
];
