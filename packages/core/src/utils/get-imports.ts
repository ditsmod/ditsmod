import { ImportObj } from '#types/metadata-per-mod.js';
import { Provider } from '#types/mix.js';

export function getImportedTokens(map: Map<any, ImportObj<Provider>> | undefined) {
  return [...(map || [])].map(([key]) => key);
}

export function getImportedProviders(map: Map<any, ImportObj<Provider>> | undefined) {
  const providers: Provider[] = [];
  [...(map || [])].map(([,importObj]) => providers.push(...importObj.providers));
  return providers;
}

export function getImportedObjects(map: Map<any, ImportObj<Provider>> | undefined) {
  const objects: ImportObj<Provider>[] = [];
  [...(map || [])].map(([,importObj]) => objects.push(importObj));
  return objects;
}