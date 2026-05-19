import 'reflect-metadata/lite';

export { Reflector } from './reflector.js';
export * from './decorators.js';
export { ForwardRefFn, forwardRef, resolveForwardRef, isForwardRef } from './forward-ref.js';
export { InjectionToken } from './common/injection-token.js';
export { Injector } from './injector.js';
export { PathTracer } from './path-tracer.js';
export { DualKey, KeyRegistry, ParamToken } from './key-registry.js';
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
} from './common/types-and-models.js';
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
} from './utils.js';
export { DepsChecker } from './deps-checker.js';
export { DecoratorAndValue } from './common/decorator-and-value.js';
export { CTX_DATA } from './common/constants.js';
export { RegistryOfInjector, ResolvedFactory, ResolvedProvider } from './common/resolved-provider.js';
