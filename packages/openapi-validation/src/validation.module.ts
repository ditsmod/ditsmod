import { Options } from 'ajv';
import { featureModule, ModuleWithParams, Providers, Class } from '@ditsmod/core';
import { PreRouterExtension, RoutesExtension } from '@ditsmod/routing';
import { DictGroup, Dictionary, I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { BodyParserExtension } from '@ditsmod/body-parser';

import { AjvService } from './ajv.service.js';
import { AJV_OPTIONS } from './constants.js';
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
      afterExtensions: [BodyParserExtension, RoutesExtension],
      beforeExtensions: [PreRouterExtension],
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
