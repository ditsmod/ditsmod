import { Class } from '#di';
import {
  AnyFn,
  AnyObj,
  ExtensionProvider,
  ModuleType,
  ModuleWithParams,
  NormalizedGuard,
  ServiceProvider,
} from '#types/mix.js';
import { AppendsWithParams } from '#types/module-metadata.js';
import { MultiProvider } from '#utils/type-guards.js';
import { ProvidersMetadata } from './providers-metadata.js';

export class NormalizedModuleMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj> extends ProvidersMetadata {
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" or "appends" array of `@Module` metadata.
   */
  module: ModuleType<T> | ModuleWithParams<T> | AppendsWithParams<T>;
  /**
   * The module name.
   */
  name: string;
  /**
   * The module ID.
   */
  id?: string = '';
  importsModules: ModuleType[] = [];
  importsWithParams: ModuleWithParams[] = [];
  appendsWithParams: AppendsWithParams[] = [];
  controllers: Class[] = [];
  decoratorFactory: AnyFn;
  exportsModules: ModuleType[] = [];
  exportsWithParams: ModuleWithParams[] = [];
  exportedProvidersPerMod: ServiceProvider[] = [];
  exportedProvidersPerRou: ServiceProvider[] = [];
  exportedProvidersPerReq: ServiceProvider[] = [];
  exportedMultiProvidersPerMod: MultiProvider[] = [];
  exportedMultiProvidersPerRou: MultiProvider[] = [];
  exportedMultiProvidersPerReq: MultiProvider[] = [];
  normalizedGuardsPerMod: NormalizedGuard[] = [];
  resolvedCollisionsPerApp: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerMod: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerRou: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerReq: [any, ModuleType | ModuleWithParams][] = [];
  extensionsProviders: ExtensionProvider[] = [];
  exportedExtensions: ExtensionProvider[] = [];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta = {} as A;
}
