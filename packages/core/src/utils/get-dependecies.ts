import { Injector } from '#di';
import { Provider } from '#types/mix.js';

export interface ReflectiveDependecy {
  token: any;
  required: boolean;
}

/**
 * Returns an array, each element of which is of type `ReflectiveDependency`. Only those dependencies that
 * are directly specified in the class constructor or in the `FactoryProvider` dependencies are taken into account.
 */
export function getDependencies(provider: Provider) {
  const uniqDeps = new Set<any>();
  const required = new Set<any>();

  Injector.resolve([provider]).forEach(({ resolvedFactories }) => {
    resolvedFactories.forEach((rf) => {
      rf.dependencies.forEach((dep) => {
        if (!dep.optional) {
          required.add(dep.dualKey.token);
        }
        uniqDeps.add(dep.dualKey.token);
      });
    });
  });

  const deps: ReflectiveDependecy[] = [];
  uniqDeps.forEach((token) => {
    deps.push({ token, required: required.has(token) });
  });

  return deps;
}
