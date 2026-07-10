import { ChainError } from '@ts-stack/chain-error';

import { isDynamicModule, isModuleDecorator } from '#decorators/type-guards.js';
import { CustomError } from '#error/custom-error.js';
import type { AnyObj } from '#types/mix.js';
import { Reflector } from '#di/reflector.js';
import { isNormalizedProvider } from '#di/utils.js';
import type { Provider } from '#di/top/types-and-models.js';

export function isProvider(maybeProvider?: any): maybeProvider is Provider {
  if (isDynamicModule(maybeProvider)) {
    return false;
  }
  const isSomeModule = Reflector.getClassLevelMeta(maybeProvider, isModuleDecorator);
  return (maybeProvider instanceof Function && !isSomeModule) || isNormalizedProvider(maybeProvider);
}

export function isChainError<T extends AnyObj>(err: any): err is ChainError<T> {
  return err instanceof ChainError;
}

export function isCustomError(err: any): err is CustomError {
  return err instanceof CustomError;
}
