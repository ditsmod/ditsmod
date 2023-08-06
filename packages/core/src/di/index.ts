import 'reflect-metadata';

export * from './decorators';
export { forwardRef, resolveForwardRef, ForwardRefFn } from './forward-ref';
export { Injector } from './injector';
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
} from './types-and-models';
export { InjectionToken } from './injection-token';
export { makeClassDecorator, makeParamDecorator, makePropDecorator } from './decorator-factories';
export { reflector } from './reflection';
export { DualKey, KeyRegistry } from './key-registry';
export {
  PropMeta,
  ParamsMeta,
  DecoratorAndValue,
  UseFactoryTuple,
  ResolvedFactory,
  ResolvedProvider,
  DiError,
} from './types-and-models';
export {
  isDecoratorAndValue,
  isClassProvider,
  isFactoryProvider,
  isMultiProvider,
  isNormalizedProvider,
  isTokenProvider,
  isTypeProvider,
  isValueProvider,
} from './utils';
