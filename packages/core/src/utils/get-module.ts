import { ModuleType } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { isModuleWithParams } from './type-guards.js';

export function getModule(modOrObj: ModuleType | ModuleWithParams): ModuleType {
  return isModuleWithParams(modOrObj) ? modOrObj.module : modOrObj;
}