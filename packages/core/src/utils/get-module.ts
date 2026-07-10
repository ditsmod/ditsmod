import type { AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { isDynamicModule } from '#decorators/type-guards.js';
import { resolveForwardRef } from '#di/forward-ref.js';

export function getModule<T extends AnyObj>(modRefId: ModRefId<T>): ModuleType<T> {
  modRefId = resolveForwardRef(modRefId);
  return isDynamicModule(modRefId) ? resolveForwardRef(modRefId.module) : modRefId;
}
