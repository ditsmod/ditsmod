import { ModuleType } from '../types/mix';
import { ModuleWithParams } from '../types/mix';
import { isModuleWithParams } from './type-guards';

export function getModule(modOrObj: ModuleType | ModuleWithParams) {
  return isModuleWithParams(modOrObj) ? modOrObj.module : modOrObj;
}