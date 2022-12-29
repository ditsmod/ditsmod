import { featureModule, ModuleWithParams, PRE_ROUTER_EXTENSIONS, Providers } from '@ditsmod/core';
import { DictGroup, Dictionary, I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { Class } from '@ditsmod/core';
import { Options } from 'ajv';

import { AjvService } from './ajv.service';
import { AJV_OPTIONS, VALIDATION_EXTENSIONS } from './constants';
import { current } from './locales/current';
import { ValidationExtension } from './validation.extension';

@featureModule({
  imports: [I18nModule],
  providersPerApp: [
    AjvService,
    ...new Providers().useValue<Options>(AJV_OPTIONS, { coerceTypes: true }),
  ],
  providersPerMod: [...new I18nProviders().i18n({ current })],
  exports: [I18nModule, I18N_TRANSLATIONS],
  extensions: [
    {
      extension: ValidationExtension,
      groupToken: VALIDATION_EXTENSIONS,
      nextToken: PRE_ROUTER_EXTENSIONS,
      exported: true,
    },
  ],
})
export class ValidationModule {
  static withParams(current: DictGroup<Class<Dictionary>>[]): ModuleWithParams<ValidationModule> {
    return {
      module: this,
      providersPerMod: [...new I18nProviders().i18n({ current })],
    };
  }
}
