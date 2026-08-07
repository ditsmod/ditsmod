import { featureModule, DynamicModule } from '@holu/core';
import { RestRouteExtension } from '@holu/rest';

import { SqbExtension } from './sqb.extension.js';

@featureModule({
  extensions: [{ extension: SqbExtension, afterExtensions: [RestRouteExtension], export: true }],
})
export class SqbModule {
  static withOpts(): DynamicModule<SqbModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
