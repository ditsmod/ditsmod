import { ReflectiveInjector } from '../di';

import { ServiceProvider } from '../types/mix';

export interface ReflectiveDependecy {
  token: any;
  required: boolean;
}

export function getDependencies(provider: ServiceProvider) {
  const uniqDeps = new Set<any>();
  const required = new Set<any>();

  ReflectiveInjector.resolve([provider]).forEach(({ resolvedFactories }) => {
    resolvedFactories.forEach((rf) => {
      rf.dependencies.forEach((dep) => {
        if (!dep.optional) {
          required.add(dep.token);
        }
        uniqDeps.add(dep.token);
      });
    });
  });

  const deps: ReflectiveDependecy[] = [];
  uniqDeps.forEach((token) => {
    deps.push({ token, required: required.has(token) });
  });

  return deps;
}
