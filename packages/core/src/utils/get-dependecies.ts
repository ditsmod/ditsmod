import { Injector } from '#di';
import { Provider } from '#types/mix.js';

export interface ReflectiveDependecy {
  token: any;
  required: boolean;
}

/**
 * This function outputs an array of direct dependencies.
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
