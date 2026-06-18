import 'reflect-metadata/lite';

/** == External imports that used for exports from `@ditsmod/core/di` == **/

export { Reflector } from '#di/reflector.js';
export { ParentParams } from '#di/parent-params.js';
export {
  factoryMethod,
  fromSelf,
  inject,
  injectable,
  input,
  optional,
  skipSelf,
  InjectTransformResult,
} from '#di/decorators.js';
export { ForwardRefFn, forwardRef, resolveForwardRef } from '#di/forward-ref.js';
export { InjectionToken } from '#di/top/injection-token.js';
export { Injector } from '#di/injector.js';
export { DualKey, KeyRegistry, ParamToken } from '#di/key-registry.js';
export {
  Class,
  ClassFactoryProvider,
  ClassProvider,
  FactoryProvider,
  FunctionFactoryProvider,
  NormalizedProvider,
  ParameterMeta,
  Provider,
  TokenProvider,
  TypeProvider,
  UseFactoryTuple,
  ValueProvider,
  ClassMeta,
  ClassPropMeta,
  MergedClassPropMeta,
  UnknownType,
} from '#di/top/types-and-models.js';
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
export { RegistryOfInjector, ResolvedFactory, ResolvedProvider } from '#di/top/resolved-provider.js';
export { DecoratorAndValue } from '#di/top/decorator-and-value.js';
export { getSymbol, InjectionSymbol } from '#di/top/get-symbol.js';
export { TypeGuard, AnyFn } from '#di/top/types-and-models.js';
