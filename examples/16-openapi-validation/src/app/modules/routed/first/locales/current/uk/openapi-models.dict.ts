import { ISO639 } from '@ditsmod/i18n';

import { OpenapiModelsDict } from '../_base-en/openapi-models.dict';

export class OpenapiUkModelsDict extends OpenapiModelsDict {
  override getLng(): ISO639 {
    return 'uk';
  }
  /**
   * Невірне ім'я користувача.
   */
  override invalidUserName = `Невірне ім'я користувача.`;
}
