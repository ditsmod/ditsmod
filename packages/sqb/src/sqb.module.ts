import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { RouteExtension } from '@ditsmod/rest';

import { SqbExtension } from './sqb.extension.js';

@featureModule({
  extensions: [{ extension: SqbExtension, afterExtensions: [RouteExtension], export: true }],
})
export class SqbModule {
  static withParams(): ModuleWithParams<SqbModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
