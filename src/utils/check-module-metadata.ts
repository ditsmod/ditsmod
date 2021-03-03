import { ModuleMetadata } from '../types/module-metadata';

export function checkModuleMetadata(modMetadata: ModuleMetadata, modName: string, isRoot?: boolean) {
  const decoratorName = isRoot ? '@RootModule' : '@Module';

  if (!modMetadata) {
    throw new Error(`Module build failed: module "${modName}" does not have the "${decoratorName}()" decorator`);
  }
}
