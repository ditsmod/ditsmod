import { ImportObj } from '#types/metadata-per-mod.js';
import { Provider } from '#di/types-and-models.js';

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
