import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { RestRouteExtension } from '@ditsmod/rest';

import { SqbExtension } from './sqb.extension.js';

@featureModule({
  extensions: [{ extension: SqbExtension, afterExtensions: [RestRouteExtension], export: true }],
})
export class SqbModule {
  static withParams(): ModuleWithParams<SqbModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
