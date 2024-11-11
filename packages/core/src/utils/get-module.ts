import { ModRefId, ModuleType } from '#types/mix.js';
import { isModuleWithParams } from './type-guards.js';

export function getModule(modOrObj: ModRefId) {
  return (isModuleWithParams(modOrObj) ? modOrObj.module : modOrObj) as ModuleType;
}
