import { format } from 'util';
import { Type, reflector, Provider } from '@ts-stack/di';

import {
  isModuleWithOptions,
  isModule,
  isRootModule,
  isNormalizedProvider,
  isImportWithOptions,
} from './utils/type-guards';
import { ModuleWithOptions, ModuleDecorator, Module } from './decorators/module';
import { mergeArrays } from './utils/merge-arrays-options';
import { RootModule } from './decorators/root-module';
import { flatten, normalizeProviders } from './utils/ng-utils';
import { ModuleType } from './types/types';

export abstract class Core {
  protected throwProvidersCollisionError(moduleName: string, duplicates: any[]) {
    const names = duplicates.map((p) => p.name || p).join(', ');
    const provider = duplicates.length > 1 ? 'these providers' : 'this provider';
    throw new Error(
      `Exporting providers to ${moduleName} was failed: found collision for: ${names}. You should manually add ${provider} to ${moduleName}.`
    );
  }

  protected getModule(mod: Type<any> | ModuleWithOptions<any>): ModuleType {
    return isModuleWithOptions(mod) ? mod.module : mod;
  }

  protected getModuleName(modOrObject: Type<any> | ModuleWithOptions<any>): string {
    if (isImportWithOptions(modOrObject)) {
      modOrObject = modOrObject.module;
    }
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
  ): ModuleDecorator {
    const typeGuard = isRoot ? isRootModule : (m: ModuleDecorator) => isModule(m) || isRootModule(m);

    if (isImportWithOptions(modOrObject)) {
      modOrObject = modOrObject.module;
    }

    if (isModuleWithOptions(modOrObject)) {
      const modWitOptions = modOrObject;
      const modMetadata: T = reflector.annotations(modWitOptions.module).find(typeGuard) as T;
      const modName = this.getModuleName(modWitOptions.module);
      this.checkModuleMetadata(modMetadata, modName, isRoot);

      const Metadata = isRoot ? RootModule : Module;
      const metadata = new Metadata(modMetadata);
      metadata.providersPerApp = mergeArrays(modMetadata.providersPerApp, modWitOptions.providersPerApp);
      metadata.providersPerMod = mergeArrays(modMetadata.providersPerMod, modWitOptions.providersPerMod);
      metadata.providersPerReq = mergeArrays(modMetadata.providersPerReq, modWitOptions.providersPerReq);
      return metadata;
    } else {
      return reflector.annotations(modOrObject).find(typeGuard);
    }
  }

  /**
   * Returns last provider if the provider has the duplicate.
   */
  protected getUniqProviders<T extends Provider = Provider>(providers: T[]) {
    const flattenedProviders = flatten<T>(providers);
    const tokens = normalizeProviders(flattenedProviders).map((np) => np.provide);
    const uniqProviders: T[] = [];

    tokens.forEach((currToken, currIndex) => {
      if (tokens.lastIndexOf(currToken) == currIndex) {
        uniqProviders.push(flattenedProviders[currIndex]);
      }
    });

    return uniqProviders;
  }

  /**
   * Returns array of uniq tokens.
   *
   * If you have a replacement for some provider - you have a collision.
   */
  protected getTokensCollisions(uniqDuplTokens: any[], providers: Provider[]) {
    uniqDuplTokens = uniqDuplTokens || [];
    providers = providers || [];
    const duplProviders: Provider[] = [];

    normalizeProviders(providers)
      .map((np) => np.provide)
      .forEach((currToken, currIndex) => {
        if (uniqDuplTokens.includes(currToken)) {
          duplProviders.push(providers[currIndex]);
        }
      });

    const normDuplProviders = normalizeProviders(duplProviders);

    return uniqDuplTokens.filter((dulpToken) => {
      let prevProvider: Provider;

      for (let i = 0; i < normDuplProviders.length; i++) {
        if (normDuplProviders[i].provide !== dulpToken) {
          continue;
        }

        const currProvider = duplProviders[i];
        if (!prevProvider) {
          prevProvider = currProvider;
        }

        if (isNormalizedProvider(prevProvider) && isNormalizedProvider(currProvider)) {
          if (prevProvider.provide !== currProvider.provide || format(prevProvider) != format(currProvider)) {
            return true;
          }
          continue;
        } else if (prevProvider !== currProvider) {
          return true;
        }
      }
    });
  }
}
