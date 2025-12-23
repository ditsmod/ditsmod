import { fromSelf, skipSelf } from './decorators.js';
import { NoProvider } from './errors.js';
import { Injector } from './injector.js';
import { DualKey, KeyRegistry } from './key-registry.js';
import { PathTracer } from './path-tracer.js';
import { Dependency, ID, ResolvedProvider, Visibility } from './types-and-models.js';

/**
 * Allow check dependencies for given provider.
 */
export class DepsChecker {
  static checkForResolved(injector: Injector, provider: ResolvedProvider, ignoreDeps?: any[]): any {
    this.checkMultiOrRegularProvider({ injector, provider, pathTracer: new PathTracer(), ignoreDeps });
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
    const pathTracer = new PathTracer();
    return this.selectInjectorAndCheckDeps({ injector, dualKey, pathTracer, visibility, ignoreDeps });
  }

  private static selectInjectorAndCheckDeps({
    injector,
    dualKey,
    pathTracer,
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
      pathTracer,
      ignoreDeps,
      visibility,
      isOptional,
    });
  }

  private static findInRegistryCurrentProvider({
    injector,
    dualKey,
    pathTracer,
    ignoreDeps,
    visibility,
    isOptional,
  }: Config1): any {
    pathTracer.addItem(dualKey.token, injector);
    if (injector) {
      if (ignoreDeps?.includes(dualKey.token)) {
        return;
      }
      const meta = injector.getValue(dualKey.id);

      // This is an alternative to the "instanceof ResolvedProvider" expression.
      if (meta?.[ID]) {
        this.checkMultiOrRegularProvider({ injector, provider: meta, pathTracer, ignoreDeps });
        return;
      } else if (meta !== undefined || injector.hasId(dualKey.id)) {
        return;
      } else if (visibility !== fromSelf && injector.parent) {
        return this.findInRegistryCurrentProvider({
          injector: injector.parent,
          dualKey,
          pathTracer,
          ignoreDeps,
          isOptional,
        });
      }
    }
    if (!isOptional) {
      throw new NoProvider(pathTracer.path);
    }
  }

  private static checkMultiOrRegularProvider({ injector, provider, pathTracer, ignoreDeps }: Config4): any {
    if (provider.multi) {
      provider.resolvedFactories.forEach(({ dependencies }) => {
        const config3: Config3 = {
          injector,
          dualKey: provider.dualKey,
          pathTracer,
          dependencies,
          ignoreDeps,
        };
        this.findInRegistryDeps(config3);
      });
    } else {
      const config3: Config3 = {
        injector,
        dualKey: provider.dualKey,
        pathTracer,
        dependencies: provider.resolvedFactories[0].dependencies,
        ignoreDeps,
      };
      return this.findInRegistryDeps(config3);
    }
  }

  private static findInRegistryDeps({ injector, pathTracer, dependencies, ignoreDeps }: Config3): any {
    dependencies = dependencies.filter((dep) => !ignoreDeps?.includes(dep.dualKey));
    dependencies.forEach((dep) => {
      const result = this.selectInjectorAndCheckDeps({
        injector,
        dualKey: dep.dualKey,
        pathTracer,
        visibility: dep.visibility,
        ignoreDeps,
        isOptional: dep.optional,
      });
      pathTracer.removeFirstItem();
      return result;
    });
  }
}

interface BaseConfig {
  pathTracer: PathTracer;
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
