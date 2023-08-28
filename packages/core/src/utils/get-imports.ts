import { ImportObj } from '#types/metadata-per-mod.js';
import { ModuleType, ModuleWithParams, ServiceProvider } from '#types/mix.js';

export function getImportedTokens(map: Map<any, ImportObj<ServiceProvider>> | undefined) {
  return [...(map || [])].map(([key]) => key);
}

export function getImportedProviders(map: Map<any, ImportObj<ServiceProvider>> | undefined) {
  const providers: ServiceProvider[] = [];
  [...(map || [])].map(([,importObj]) => providers.push(...importObj.providers));
  return providers;
}

export function getImportedObjects(map: Map<any, ImportObj<ServiceProvider>> | undefined) {
  const objects: ImportObj<ServiceProvider>[] = [];
  [...(map || [])].map(([,importObj]) => objects.push(importObj));
  return objects;
}