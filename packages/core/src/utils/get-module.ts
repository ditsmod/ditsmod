import { ModuleType, ModuleWithParams } from '#types/mix.js';
import { isModuleWithParams } from './type-guards.js';

export function getModule(modOrObj: ModuleType | ModuleWithParams) {
  return isModuleWithParams(modOrObj) ? modOrObj.module : modOrObj;
}