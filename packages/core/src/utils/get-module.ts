import { ModRefId, ModuleType } from '#types/mix.js';
import { isModuleWithParams } from './type-guards.js';

export function getModule(modRefId: ModRefId) {
  return (isModuleWithParams(modRefId) ? modRefId.module : modRefId) as ModuleType;
}
