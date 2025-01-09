import { Options } from 'ajv';
import { featureModule, ModuleWithParams, Providers, Class } from '@ditsmod/core';
import { PRE_ROUTER_EXTENSIONS, ROUTES_EXTENSIONS } from '@ditsmod/routing';
import { DictGroup, Dictionary, I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';

import { AjvService } from './ajv.service.js';
import { AJV_OPTIONS, VALIDATION_EXTENSIONS } from './constants.js';
import { current } from './locales/current/index.js';
import { ValidationExtension } from './validation.extension.js';

@featureModule({
  imports: [I18nModule],
  providersPerApp: new Providers().passThrough(AjvService).useValue<Options>(AJV_OPTIONS, { coerceTypes: true }),
  providersPerMod: new I18nProviders().i18n({ current }),
  exports: [I18nModule, I18N_TRANSLATIONS],
  extensions: [
    {
      extension: ValidationExtension,
      group: VALIDATION_EXTENSIONS,
      afterGroups: [BODY_PARSER_EXTENSIONS, ROUTES_EXTENSIONS],
      beforeGroups: [PRE_ROUTER_EXTENSIONS],
      exportOnly: true,
    },
  ],
})
export class ValidationModule {
  static withParams(current: DictGroup<Class<Dictionary>>[]): ModuleWithParams<ValidationModule> {
    return {
      module: this,
      providersPerMod: new I18nProviders().i18n({ current }),
    };
  }
}
