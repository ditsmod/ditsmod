import { resolveForwardRef } from '#di';
import { AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { isModuleWithParams } from './type-guards.js';

export function getModule<T extends AnyObj>(modRefId: ModRefId<T>): ModuleType<T> {
  modRefId = resolveForwardRef(modRefId);
  return isModuleWithParams(modRefId) ? resolveForwardRef(modRefId.module) : modRefId;
}
