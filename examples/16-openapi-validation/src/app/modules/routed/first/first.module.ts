import { InitParamsMap, ModuleWithInitParams } from '@ditsmod/core';
import { I18nProviders } from '@ditsmod/i18n';
import { ValidationModule } from '@ditsmod/openapi-validation';
import { BodyParserModule } from '@ditsmod/body-parser';
import { initRest, restModule } from '@ditsmod/rest';

import { FirstController } from './first.controller.js';
import { current } from './locales/current/index.js';
import { imported } from './locales/imported/index.js';

@restModule({
  imports: [BodyParserModule, ValidationModule.withParams(current)],
  providersPerMod: new I18nProviders().i18n({ imported }),
  controllers: [FirstController],
})
export class FirstModule {
  static withPath(path?: string): ModuleWithInitParams<FirstModule> {
    const initParams: InitParamsMap = new Map();
    initParams.set(initRest, { path });

    return {
      module: this,
      initParams,
    };
  }
}
