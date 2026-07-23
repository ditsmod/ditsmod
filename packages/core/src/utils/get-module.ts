import type { AnyObj } from '#types/mix.js';
import type { ModRefId, StaticModule } from '#decorators/module-decorator-options.js';
import { isDynamicModule } from '#decorators/type-guards.js';
import { resolveForwardRef } from '#di/forward-ref.js';

export function getModule<T extends AnyObj>(modRefId: ModRefId<T>): StaticModule<T> {
  modRefId = resolveForwardRef(modRefId);
  return isDynamicModule(modRefId) ? resolveForwardRef(modRefId.module) : modRefId;
}
