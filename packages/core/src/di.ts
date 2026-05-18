import 'reflect-metadata/lite';

export { Reflector } from '#di/reflector.js';
export * from '#di/decorators.js';
export { ForwardRefFn, forwardRef, resolveForwardRef } from '#di/forward-ref.js';
export { InjectionToken } from '#di/injection-token.js';
export { Injector } from '#di/injector.js';
export { DualKey, KeyRegistry, ParamToken } from '#di/key-registry.js';
export {
  Class,
  ClassFactoryProvider,
  ClassProvider,
  DecoratorAndValue,
  FactoryProvider,
  FunctionFactoryProvider,
  NormalizedProvider,
  ParamsMeta,
  Provider,
  RegistryOfInjector,
  ResolvedFactory,
  ResolvedProvider,
  TokenProvider,
  TypeProvider,
  UseFactoryTuple,
  ValueProvider,
  CTX_DATA,
  ClassMeta,
  ClassPropMeta,
  UnknownType
} from '#di/types-and-models.js';
export {
  isClassFactoryProvider,
  isClassProvider,
  isDecoratorAndValue,
  isFactoryProvider,
  isFunctionFactoryProvider,
  isMultiProvider,
  isNormalizedProvider,
  isTokenProvider,
  isTypeProvider,
  isValueProvider,
  isInjectionToken,
  MultiProvider,
} from '#di/utils.js';
export { DepsChecker } from '#di/deps-checker.js';
