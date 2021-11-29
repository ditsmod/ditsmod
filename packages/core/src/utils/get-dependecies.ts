import { ReflectiveInjector } from '@ts-stack/di';

import { ServiceProvider } from '../types/mix';

export function getDependencies(provider: ServiceProvider) {
  const deps = new Set<any>();

  ReflectiveInjector.resolve([provider]).forEach(({ resolvedFactories }) => {
    resolvedFactories.forEach((rf) => {
      rf.dependencies.forEach((dep) => {
        deps.add(dep.key.token);
      });
    });
  });

  return [...deps];
}
