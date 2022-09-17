import { Dictionary, ISO639 } from '@ditsmod/i18n';

export class OpenapiModelsDict implements Dictionary {
  getLng(): ISO639 {
    return 'en';
  }
  /**
   * Invalid user name
   */
  invalidUserName = `Invalid user name`;
}
