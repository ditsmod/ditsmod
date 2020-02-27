import { Type, reflector } from '@ts-stack/di';

import { isModuleWithOptions, isModule, isRootModule } from './utils/type-guards';
import { ModuleWithOptions, ModuleDecorator, Module } from './decorators/module';
import { mergeArrays } from './utils/merge-arrays-options';
import { RootModule } from './decorators/root-module';
import { deepFreeze } from './utils/deep-freeze';

export abstract class Factory {
  protected throwErrorProvidersUnpredictable(moduleName: string, duplicates: any[]) {
    const names = duplicates.map(p => p.name || p).join(', ');
    throw new Error(
      `Exporting providers in ${moduleName} was failed: Unpredictable priority was found for: ${names}. You should manually add these providers to ${moduleName}.`
    );
  }

  protected getModule(mod: Type<any> | ModuleWithOptions<any>) {
    return isModuleWithOptions(mod) ? mod.module : mod;
  }

  protected getModuleName(modOrObject: Type<any> | ModuleWithOptions<any>) {
    return isModuleWithOptions(modOrObject) ? modOrObject.module.name : modOrObject.name;
  }

  protected checkModuleMetadata(modMetadata: ModuleDecorator, modName: string, isRoot?: boolean) {
    const decoratorName = isRoot ? '@RootModule' : '@Module';

    if (!modMetadata) {
      throw new Error(`Module build failed: module "${modName}" does not have the "${decoratorName}()" decorator`);
    }
  }

  protected getRawModuleMetadata<T extends ModuleDecorator>(
    modOrObject: Type<any> | ModuleWithOptions<any>,
    isRoot?: boolean
  ) {
    let modMetadata: T;
    const typeGuard = isRoot ? isRootModule : (m: ModuleDecorator) => isModule(m) || isRootModule(m);
    const Metadata = isRoot ? RootModule : Module;

    if (isModuleWithOptions(modOrObject)) {
      const modWitOptions = modOrObject;
      modMetadata = reflector.annotations(modWitOptions.module).find(typeGuard) as T;
      const modName = this.getModuleName(modWitOptions.module);
      this.checkModuleMetadata(modMetadata, modName, isRoot);

      const metadata = new Metadata(modMetadata);
      metadata.providersPerApp = mergeArrays(modMetadata.providersPerApp, modWitOptions.providersPerApp);
      metadata.providersPerMod = mergeArrays(modMetadata.providersPerMod, modWitOptions.providersPerMod);
      metadata.providersPerReq = mergeArrays(modMetadata.providersPerReq, modWitOptions.providersPerReq);
      return deepFreeze(metadata);
    } else {
      return deepFreeze<T>(reflector.annotations(modOrObject).find(typeGuard));
    }
  }
}
