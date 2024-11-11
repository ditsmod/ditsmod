import { ModRefId } from '#types/mix.js';
import { isAppendsWithParams, isModuleWithParams } from './type-guards.js';

export function getModuleName(modRefId: ModRefId): string {
  if (isModuleWithParams(modRefId) || isAppendsWithParams(modRefId)) {
    return modRefId.id || modRefId.module.name;
  } else {
    return modRefId.name;
  }
}
