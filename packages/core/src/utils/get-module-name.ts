import { ModuleType, ModuleWithParams } from '#types/mix.js';
import { isModuleWithParams } from './type-guards.js';

export function getModuleName(modOrObject: ModuleType | ModuleWithParams): string {
  return isModuleWithParams(modOrObject) ? modOrObject.module.name : modOrObject.name;
}
