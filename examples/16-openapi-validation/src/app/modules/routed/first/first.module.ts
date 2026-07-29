import { MixinDynamicOptionsMap, DynamicModuleWithMixinOptions } from '@ditsmod/core';
import { ValidationModule } from '@ditsmod/openapi-validation';
import { BodyParserModule } from '@ditsmod/body-parser';
import { mixinRest, restModule } from '@ditsmod/rest';

import { FirstController } from './first.controller.js';

@restModule({
  imports: [BodyParserModule, ValidationModule],
  controllers: [FirstController],
})
export class FirstModule {
  static withPath(path?: string): DynamicModuleWithMixinOptions<FirstModule> {
    const mixinOptions: MixinDynamicOptionsMap = new Map();
    mixinOptions.set(mixinRest, { path });

    return {
      module: this,
      mixinOptions,
    };
  }
}
