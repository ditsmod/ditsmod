import { type InjectTransformResult, inject } from '#di/decorators.js';
import { Reflector } from '#di/reflector.js';
import type { InjectionSymbol } from '#di/top/get-symbol.js';

export const ctx = Reflector.makeParamDecorator(
  (key: string | symbol | InjectionSymbol) => ({ token: ctx, input: key }) satisfies InjectTransformResult,
  'ctx',
  inject,
);
