import { InitDynamicOptionsMap, DynamicModuleWithInitOptions } from '@ditsmod/core';
import { ValidationModule } from '@ditsmod/openapi-validation';
import { BodyParserModule } from '@ditsmod/body-parser';
import { initRest, restModule } from '@ditsmod/rest';

import { FirstController } from './first.controller.js';

@restModule({
  imports: [BodyParserModule, ValidationModule],
  controllers: [FirstController],
})
export class FirstModule {
  static withPath(path?: string): DynamicModuleWithInitOptions<FirstModule> {
    const initOptions: InitDynamicOptionsMap = new Map();
    initOptions.set(initRest, { path });

    return {
      module: this,
      initOptions,
    };
  }
}
