import { Options } from 'ajv';
import { featureModule, DynamicModule, ProviderBuilder, Class } from '@ditsmod/core';
import { DispatcherExtension, RestRouteExtension } from '@ditsmod/rest';
import { DictGroup, Dictionary, I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { BodyParserExtension } from '@ditsmod/body-parser';

import { AjvService } from './ajv.service.js';
import { AJV_OPTIONS } from './constants.js';
import { current } from './locales/current/index.js';
import { ValidationExtension } from './validation.extension.js';

@featureModule({
  imports: [I18nModule],
  providersPerApp: new ProviderBuilder().passThrough(AjvService).useValue<Options>(AJV_OPTIONS, { coerceTypes: true }),
  providersPerMod: new I18nProviders().i18n({ current }),
  exports: [I18nModule, I18N_TRANSLATIONS],
  extensions: [
    {
      extension: ValidationExtension,
      afterExtensions: [BodyParserExtension, RestRouteExtension],
      beforeExtensions: [DispatcherExtension],
      exportOnly: true,
    },
  ],
})
export class ValidationModule {
  static withOpts(current: DictGroup<Class<Dictionary>>[]): DynamicModule<ValidationModule> {
    return {
      module: this,
      providersPerMod: new I18nProviders().i18n({ current }),
    };
  }
}
