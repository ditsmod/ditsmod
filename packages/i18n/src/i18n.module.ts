import { Module, ModuleWithParams, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { I18nExtension } from './i18n.extension';
import { I18N_EXTENSIONS, I18N_OPTIONS } from './types/mix';

@Module({
  extensions: [[I18N_EXTENSIONS, PRE_ROUTER_EXTENSIONS, I18nExtension]],
})
export class I18nModule {
  static withParams(options: any = {}): ModuleWithParams<I18nModule> {
    return {
      module: this,
      providersPerMod: [{ provide: I18N_OPTIONS, useValue: options }],
    };
  }
}
