import { featureModule, DynamicModule } from '@ditsmod/core';
import { RestRouteExtension } from '@ditsmod/rest';

import { SqbExtension } from './sqb.extension.js';

@featureModule({
  extensions: [{ extension: SqbExtension, afterExtensions: [RestRouteExtension], export: true }],
})
export class SqbModule {
  static withParams(): DynamicModule<SqbModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
