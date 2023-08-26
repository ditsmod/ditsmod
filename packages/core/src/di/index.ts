import 'reflect-metadata';

export * from './decorators.js';
export { forwardRef, resolveForwardRef, ForwardRefFn } from './forward-ref.js';
export { Injector } from './injector.js';
export {
  Provider,
  TypeProvider,
  ValueProvider,
  ClassProvider,
  TokenProvider,
  FactoryProvider,
  Class,
  NormalizedProvider,
  RegistryOfInjector,
} from './types-and-models.js';
export { InjectionToken } from './injection-token.js';
export { makeClassDecorator, makeParamDecorator, makePropDecorator } from './decorator-factories.js';
export { reflector } from './reflection.js';
export { DualKey, KeyRegistry } from './key-registry.js';
export {
  PropMeta,
  ParamsMeta,
  DecoratorAndValue,
  UseFactoryTuple,
  FunctionFactoryProvider,
  ClassFactoryProvider,
  ResolvedFactory,
  ResolvedProvider,
  DiError,
} from './types-and-models.js';
export {
  isDecoratorAndValue,
  isClassProvider,
  isFactoryProvider,
  isFunctionFactoryProvider,
  isMultiProvider,
  isNormalizedProvider,
  isTokenProvider,
  isTypeProvider,
  isValueProvider,
} from './utils.js';
