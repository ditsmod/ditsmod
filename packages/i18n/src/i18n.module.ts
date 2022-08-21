import { Module, ModuleWithParams, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { I18nLogMediator } from './i18n-log-mediator';
import { I18nExtension } from './i18n.extension';
import { I18nService } from './i18n.service';
import { I18nOptions, I18N_EXTENSIONS, I18N_TRANSLATIONS, TranslationTuple } from './types/mix';

@Module({
  extensions: [[I18N_EXTENSIONS, PRE_ROUTER_EXTENSIONS, I18nExtension, true]],
  providersPerMod: [
    I18nService,
    I18nOptions,
    I18nLogMediator
  ],
  exports: [I18nService, I18nOptions]
})
export class I18nModule {
  static withParams(translationTuples: TranslationTuple[]): ModuleWithParams<I18nModule> {
    return {
      module: this,
      providersPerMod: [{ provide: I18N_TRANSLATIONS, useValue: translationTuples, multi: true }],
    };
  }
}
