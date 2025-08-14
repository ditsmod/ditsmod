import 'reflect-metadata/lite';

export { makeClassDecorator, makeParamDecorator, makePropDecorator } from '#di/decorator-factories.js';
export * from '#di/decorators.js';
export { ForwardRefFn, forwardRef, resolveForwardRef } from '#di/forward-ref.js';
export { InjectionToken } from '#di/injection-token.js';
export { Injector } from '#di/injector.js';
export { DualKey, KeyRegistry, ParamToken } from '#di/key-registry.js';
export { reflector } from '#di/reflection.js';
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
  SymbolIterator,
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
