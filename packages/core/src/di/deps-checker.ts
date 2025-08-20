import { fromSelf, skipSelf } from './decorators.js';
import { CyclicDependency, NoProvider } from './errors.js';
import { Injector } from './injector.js';
import { DualKey, KeyRegistry } from './key-registry.js';
import { Dependency, ID, ResolvedProvider, Visibility } from './types-and-models.js';

/**
 * Allow check dependencies for given provider.
 */
export class DepsChecker {
  static checkForResolved(injector: Injector, provider: ResolvedProvider, ignoreDeps?: any[]): any {
    this.checkMultiOrRegularProvider({ injector, provider, parentTokens: [], ignoreDeps });
  }

  /**
   * An analogue of `injector.get()`, but this method only checks the presence
   * of dependencies for given token. In this case, an instance of the corresponding
   * class is not created, the action bound to `useFactory` is not executed, etc.
   *
   * If there are problems with dependencies, throws the corresponding error.
   */
  static check(
    injector: Injector,
    token: NonNullable<unknown>,
    visibility: Visibility = null,
    ignoreDeps?: any[],
  ): any {
    const dualKey = KeyRegistry.get(token);
    const parentTokens: any[] = [];
    return this.selectInjectorAndCheckDeps({ injector, dualKey, parentTokens, visibility, ignoreDeps });
  }

  private static selectInjectorAndCheckDeps({
    injector,
    dualKey,
    parentTokens,
    visibility,
    ignoreDeps,
    isOptional,
  }: Config2) {
    if (dualKey.token === Injector) {
      return;
    }

    injector = visibility === skipSelf ? injector?.parent : injector;
    return this.findInRegistryCurrentProvider({
      injector,
      dualKey,
      parentTokens,
      ignoreDeps,
      visibility,
      isOptional,
    });
  }

  private static findInRegistryCurrentProvider({
    injector,
    dualKey,
    parentTokens,
    ignoreDeps,
    visibility,
    isOptional,
  }: Config1): any {
    if (injector) {
      if (ignoreDeps?.includes(dualKey.token)) {
        return;
      }
      const meta = injector.getValue(dualKey.id);

      // This is an alternative to the "instanceof ResolvedProvider" expression.
      if (meta?.[ID]) {
        if (parentTokens.includes(dualKey.token)) {
          throw new CyclicDependency([dualKey.token, ...parentTokens]);
        }
        this.checkMultiOrRegularProvider({ injector, provider: meta, parentTokens, ignoreDeps });
        return;
      } else if (meta !== undefined || injector.hasId(dualKey.id)) {
        return;
      } else if (visibility !== fromSelf && injector.parent) {
        return this.findInRegistryCurrentProvider({
          injector: injector.parent,
          dualKey,
          parentTokens,
          ignoreDeps,
          isOptional,
        });
      }
    }
    if (!isOptional) {
      throw new NoProvider([dualKey.token, ...parentTokens]);
    }
  }

  private static checkMultiOrRegularProvider({ injector, provider, parentTokens, ignoreDeps }: Config4): any {
    if (provider.multi) {
      provider.resolvedFactories.forEach(({ dependencies }) => {
        const config3: Config3 = {
          injector,
          dualKey: provider.dualKey,
          parentTokens,
          dependencies,
          ignoreDeps,
        };
        this.findInRegistryDeps(config3);
      });
    } else {
      const config3: Config3 = {
        injector,
        dualKey: provider.dualKey,
        parentTokens,
        dependencies: provider.resolvedFactories[0].dependencies,
        ignoreDeps,
      };
      return this.findInRegistryDeps(config3);
    }
  }

  private static findInRegistryDeps({ injector, dualKey, parentTokens, dependencies, ignoreDeps }: Config3): any {
    dependencies = dependencies.filter((dep) => !ignoreDeps?.includes(dep.dualKey));
    dependencies.forEach((dep) => {
      return this.selectInjectorAndCheckDeps({
        injector,
        dualKey: dep.dualKey,
        parentTokens: [dualKey.token, ...parentTokens],
        visibility: dep.visibility,
        ignoreDeps,
        isOptional: dep.optional,
      });
    });
  }
}

interface BaseConfig {
  parentTokens: any[];
  injector?: Injector | null;
  dualKey?: DualKey;
  visibility?: Visibility;
  ignoreDeps?: any[];
  dependencies?: Dependency[];
  provider?: ResolvedProvider;
  onlyFromSelf?: boolean;
  defaultValue?: any;
  isOptional?: boolean;
}

interface Config4 extends BaseConfig {
  provider: ResolvedProvider;
  injector: Injector | null | undefined;
}

interface Config3 extends BaseConfig {
  injector: Injector | null | undefined;
  dualKey: DualKey;
  dependencies: Dependency[];
}

interface Config2 extends BaseConfig {
  injector: Injector | null | undefined;
  dualKey: DualKey;
  visibility: Visibility;
}

interface Config1 extends BaseConfig {
  injector: Injector | null | undefined;
  dualKey: DualKey;
}
