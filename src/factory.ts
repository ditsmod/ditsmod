import { format } from 'util';
import { Type, reflector, Provider } from '@ts-stack/di';

import { isModuleWithOptions, isModule, isRootModule, isProvider } from './utils/type-guards';
import { ModuleWithOptions, ModuleDecorator, Module } from './decorators/module';
import { mergeArrays } from './utils/merge-arrays-options';
import { RootModule } from './decorators/root-module';
import { deepFreeze } from './utils/deep-freeze';
import { normalizeProviders } from './utils/ng-utils';

export abstract class Factory {
  protected throwProvidersCollisionError(moduleName: string, duplicates: any[]) {
    const names = duplicates.map((p) => p.name || p).join(', ');
    const provider = duplicates.length > 1 ? 'these providers' : 'this provider';
    throw new Error(
      `Exporting providers in ${moduleName} was failed: Collision was found for: ${names}. You should manually add ${provider} to ${moduleName}.`
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

  /**
   * Returns last provider if the provider has the duplicate.
   */
  protected getUniqProviders(providers: Provider[]) {
    const tokens = normalizeProviders(providers).map((np) => np.provide);
    const uniqProviders: Provider[] = [];

    tokens.forEach((currToken, currIndex) => {
      if (tokens.lastIndexOf(currToken) == currIndex) {
        uniqProviders.push(providers[currIndex]);
      }
    });

    return uniqProviders;
  }

  protected getTokensCollisions(duplTokens: any[], providers: Provider[]) {
    duplTokens = duplTokens || [];
    providers = providers || [];
    const duplProviders: Provider[] = [];

    normalizeProviders(providers)
      .map((np) => np.provide)
      .forEach((currToken, currIndex) => {
        if (duplTokens.includes(currToken)) {
          duplProviders.push(providers[currIndex]);
        }
      });

    const normDuplProviders = normalizeProviders(duplProviders);

    return duplTokens.filter((dulpToken) => {
      let prevProvider: Provider;

      for (let i = 0; i < normDuplProviders.length; i++) {
        if (normDuplProviders[i].provide !== dulpToken) {
          continue;
        }

        const currProvider = duplProviders[i];
        if (!prevProvider) {
          prevProvider = currProvider;
        }
        if (isProvider(prevProvider) && isProvider(currProvider)) {
          if (prevProvider.provide !== currProvider.provide || format(prevProvider) != format(currProvider)) {
            return true;
          }
        } else if (prevProvider !== currProvider) {
          return true;
        }
      }
    });
  }
}
