import 'reflect-metadata/lite';

/** == Internal imports (it's not used for exports from `@ditsmod/core/di`) == **/

export { Reflector } from './reflector.js';
export * from './decorators.js';
export { ForwardRefFn, forwardRef, resolveForwardRef, isForwardRef } from './forward-ref.js';
export { InjectionToken } from './top/injection-token.js';
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
} from './top/types-and-models.js';
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
export { DecoratorAndValue } from './top/decorator-and-value.js';
export { CTX_DATA } from './top/constants.js';
export { RegistryOfInjector, ResolvedFactory, ResolvedProvider } from './top/resolved-provider.js';
