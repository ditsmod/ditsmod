import 'reflect-metadata/lite';

export { Reflector } from '#di/reflector.js';
export * from '#di/decorators.js';
export { ForwardRefFn, forwardRef, resolveForwardRef } from '#di/forward-ref.js';
export { InjectionToken } from '#di/common/injection-token.js';
export { Injector } from '#di/injector.js';
export { DualKey, KeyRegistry, ParamToken } from '#di/key-registry.js';
export {
  Class,
  ClassFactoryProvider,
  ClassProvider,
  FactoryProvider,
  FunctionFactoryProvider,
  NormalizedProvider,
  ParamsMeta,
  Provider,
  TokenProvider,
  TypeProvider,
  UseFactoryTuple,
  ValueProvider,
  ClassMeta,
  ClassPropMeta,
  UnknownType,
} from '#di/common/types-and-models.js';
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
export { CTX_DATA } from '#di/common/constants.js';
export { DepsChecker } from '#di/deps-checker.js';
export { RegistryOfInjector, ResolvedFactory, ResolvedProvider } from '#di/common/resolved-provider.js';
export { DecoratorAndValue } from '#di/common/decorator-and-value.js';
