import type { Provider } from '#di/top/types-and-models.js';
import type { ImportedProvider } from '#types/metadata-per-mod.js';

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
