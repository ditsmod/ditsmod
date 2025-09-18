import { ChainError } from '@ts-stack/chain-error';

import { isModuleWithParams, isModDecor } from '#decorators/type-guards.js';
import { Provider, reflector, Class, isNormalizedProvider } from '#di';
import { CustomError } from '#error/custom-error.js';
import { AnyObj } from '#types/mix.js';

export function isProvider(maybeProvider?: any): maybeProvider is Provider {
  if (isModuleWithParams(maybeProvider)) {
    return false;
  }
  const isSomeModule = reflector.getDecorators(maybeProvider, isModDecor);
  return (maybeProvider instanceof Class && !isSomeModule) || isNormalizedProvider(maybeProvider);
}

export interface TypeGuard<T> {
  (arg: any): arg is T;
}

export function isChainError<T extends AnyObj>(err: any): err is ChainError<T> {
  return err instanceof ChainError;
}

export function isCustomError(err: any): err is CustomError {
  return err instanceof CustomError;
}
