import type { ImportedProvider, Provider } from '@ditsmod/core';

export function getImportedTokens(map: Map<any, ImportedProvider<Provider>> | undefined) {
  return [...(map || []).keys()];
}

export function getImportedProviders(map: Map<any, ImportedProvider<Provider>> | undefined) {
  const providers: Provider[] = [];
  for (const importedProvider of (map || []).values()) {
    providers.push(...importedProvider.providers);
  }
  return providers;
}

export function getImportedObjects(map: Map<any, ImportedProvider<Provider>> | undefined) {
  return [...(map || []).values()];
}
