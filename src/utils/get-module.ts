import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { isModuleWithParams } from './type-guards';

export function getModule(modOrObj: ModuleType | ModuleWithParams<any>) {
  return isModuleWithParams(modOrObj) ? modOrObj.module : modOrObj;
}