import { Module, ModuleWithParams, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { I18nLogMediator } from './i18n-log-mediator';
import { I18nExtension } from './i18n.extension';
import { I18N_EXTENSIONS, I18nOptions } from './types/mix';

@Module({
  extensions: [[I18N_EXTENSIONS, PRE_ROUTER_EXTENSIONS, I18nExtension, true]],
  providersPerMod: [
    { provide: I18nOptions, useValue: {} },
    I18nLogMediator
  ],
})
export class I18nModule {
  static withParams(options: any = {}): ModuleWithParams<I18nModule> {
    return {
      module: this,
      providersPerMod: [{ provide: I18nOptions, useValue: options }],
    };
  }
}
