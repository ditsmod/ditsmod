import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { ROUTE_EXTENSIONS } from '@ditsmod/routing';

import { SQB_EXTENSIONS } from './types.js';
import { SqbExtension } from './sqb.extension.js';

@featureModule({
  extensions: [{ group: SQB_EXTENSIONS, afterGroups: [ROUTE_EXTENSIONS], extension: SqbExtension, export: true }],
})
export class SqbModule {
  static withParams(): ModuleWithParams<SqbModule> {
    return {
      module: this,
      providersPerMod: [],
    };
  }
}
