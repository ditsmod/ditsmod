import { Module, ModuleWithParams, PRE_ROUTER_EXTENSIONS, Providers } from '@ditsmod/core';
import { DictGroup, Dictionary, I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { Type } from '@ts-stack/di';
import { Options } from 'ajv';

import { AjvService } from './ajv.service';
import { AssertConfig } from './assert-config';
import { AssertService } from './assert.service';
import { AJV_OPTIONS, VALIDATION_EXTENSIONS } from './constants';
import { current } from './locales/current';
import { ValidationExtension } from './validation.extension';

@Module({
  imports: [I18nModule],
  providersPerApp: [
    AssertConfig,
    AjvService,
    ...new Providers().useAnyValue<Options>(AJV_OPTIONS, { coerceTypes: true }),
  ],
  providersPerMod: [...new I18nProviders().i18n({ current })],
  providersPerReq: [AssertService],
  exports: [I18nModule, AssertService, I18N_TRANSLATIONS],
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
  static withParams(current: DictGroup<Type<Dictionary>>[]): ModuleWithParams<ValidationModule> {
    return {
      module: this,
      providersPerMod: [...new I18nProviders().i18n({ current })],
    };
  }
}
