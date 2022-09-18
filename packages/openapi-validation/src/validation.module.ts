import { Module, ModuleWithParams, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';
import { DictGroup, Dictionary, I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { Type } from '@ts-stack/di';

import { AssertConfig } from './assert-config';
import { AssertService } from './assert.service';
import { VALIDATION_EXTENSIONS } from './constants';
import { current } from './locales/current';
import { ValidationExtension } from './validation.extension';

@Module({
  imports: [I18nModule],
  providersPerApp: [AssertConfig],
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
    }
  }
}
