import { Type, reflector } from 'ts-di';

import { isModuleWithOptions, isModule, isRootModule } from './utils/type-guards';
import { ModuleWithOptions, ModuleDecorator } from './decorators/module';
import { mergeArrays } from './utils/merge-arrays-options';

export abstract class Factory {
  protected getModuleName(typeOrObject: Type<any> | ModuleWithOptions<any>) {
    return isModuleWithOptions(typeOrObject) ? typeOrObject.module.name : typeOrObject.name;
  }

  protected checkModuleMetadata(modMetadata: ModuleDecorator, modName: string) {
    if (!modMetadata) {
      throw new Error(`Module build failed: module "${modName}" does not have the "@Module()" decorator`);
    }
  }

  protected getRawModuleMetadata<T extends ModuleDecorator>(
    typeOrObject: Type<any> | ModuleWithOptions<any>,
    isRoot?: boolean
  ) {
    let modMetadata: T;
    const typeGuard = isRoot ? isRootModule : (m: ModuleDecorator) => isModule(m) || isRootModule(m);

    if (isModuleWithOptions(typeOrObject)) {
      const modWitOptions = typeOrObject;
      modMetadata = reflector.annotations(modWitOptions.module).find(typeGuard) as T;
      const modName = this.getModuleName(modWitOptions.module);
      this.checkModuleMetadata(modMetadata, modName);

      modMetadata.providersPerApp = mergeArrays(modWitOptions.providersPerApp, modMetadata.providersPerApp);
      modMetadata.providersPerMod = mergeArrays(modWitOptions.providersPerMod, modMetadata.providersPerMod);
      modMetadata.providersPerReq = mergeArrays(modWitOptions.providersPerReq, modMetadata.providersPerReq);
    } else {
      modMetadata = reflector.annotations(typeOrObject).find(typeGuard) as T;
    }

    return modMetadata;
  }
}
