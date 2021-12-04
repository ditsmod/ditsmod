import { ImportObj } from '../types/metadata-per-mod';
import { ModuleType, ModuleWithParams, ServiceProvider } from '../types/mix';

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