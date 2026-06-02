import { type InjectTransformResult, inject } from '../decorators.js';
import { Reflector } from '../reflector.js';
import type { InjectionSymbol } from './get-symbol.js';

export const ctx = Reflector.makeParamDecorator(
  (key: string | symbol | InjectionSymbol) => ({ token: ctx, input: key }) satisfies InjectTransformResult,
  'ctx',
  inject,
);
