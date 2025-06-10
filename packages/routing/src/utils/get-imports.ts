import { ImportObj, Provider } from '@ditsmod/core';

export function getImportedTokens(map: Map<any, ImportObj<Provider>> | undefined) {
  return [...(map || []).keys()];
}

export function getImportedProviders(map: Map<any, ImportObj<Provider>> | undefined) {
  const providers: Provider[] = [];
  for (const importObj of (map || []).values()) {
    providers.push(...importObj.providers);
  }
  return providers;
}

export function getImportedObjects(map: Map<any, ImportObj<Provider>> | undefined) {
  return [...(map || []).values()];
}
