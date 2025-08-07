import { featureModule, InitParamsMap, ModuleWithInitParams } from '@ditsmod/core';
import { I18nModule, I18nProviders, I18N_TRANSLATIONS } from '@ditsmod/i18n';
import { initRest } from '@ditsmod/rest';

import { FirstModule } from './first.module.js';
import { SecondController } from './second/second.controller.js';
import { current } from './second/locales/current/index.js';
import { imported } from './second/locales/imported/index.js';

@initRest({
  imports: [I18nModule, FirstModule],
  providersPerMod: new I18nProviders().i18n({ current, imported }, { defaultLng: 'uk' }),
  controllers: [SecondController],
  exports: [I18N_TRANSLATIONS],
})
@featureModule()
export class SecondModule {
  static withPath(path?: string): ModuleWithInitParams<SecondModule> {
    const initParams: InitParamsMap = new Map();
    initParams.set(initRest, { path });

    return {
      module: this,
      initParams,
    };
  }
}
