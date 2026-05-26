import { type InjectTransformResult, inject } from '../decorators.js';
import { Reflector } from '../reflector.js';

export const ctx = Reflector.makeParamDecorator(
  (token?: any) => ({ token: ctx, ctx: token }) satisfies InjectTransformResult,
  'ctx',
  inject,
);
