import { ModuleType, ModuleWithParams } from '../types/mix';
import { isModuleWithParams } from './type-guards';

export function getModuleName(modOrObject: ModuleType | ModuleWithParams): string {
  return isModuleWithParams(modOrObject) ? modOrObject.module.name : modOrObject.name;
}
