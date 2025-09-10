import { Provider } from '#di/types-and-models.js';
import { ProviderImport } from '#types/metadata-per-mod.js';

export function getImportedTokens(map: Map<any, ProviderImport<Provider>> | undefined) {
  return [...(map || []).keys()];
}

export function getImportedProviders(map: Map<any, ProviderImport<Provider>> | undefined) {
  const providers: Provider[] = [];
  for (const providerImport of (map || []).values()) {
    providers.push(...providerImport.providers);
  }
  return providers;
}

export function getImportedObjects(map: Map<any, ProviderImport<Provider>> | undefined) {
  return [...(map || []).values()];
}
