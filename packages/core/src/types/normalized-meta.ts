import { MultiProvider } from '#di';
import { AnyFn, AnyObj, ModRefId, ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from './module-metadata.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { ExtensionClass } from '#extension/extension-types.js';
import { InitImportExport } from '#decorators/init-hooks-and-metadata.js';
import { InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';
import { AllInitHooks } from '#init/module-manager.js';

export interface InitMetaMap {
  set<T extends InitImportExport>(decorator: AddDecorator<any, T>, params: T): this;
  get<T extends InitImportExport>(decorator: AddDecorator<any, T>): T | undefined;
  forEach<T extends InitImportExport>(
    callbackfn: (params: T, decorator: AnyFn, map: Map<AnyFn, T>) => void,
    thisArg?: any,
  ): void;
  /**
   * Returns an iterable of keys in the map
   */
  keys(): MapIterator<AnyFn>;
  readonly size: number;
}

/**
 * Use this interface to create decorators with init hooks.
 * 
 * ### Complete example with init hooks
 * 
 * In this example, `ReturnsType` is the type that will be returned by
 * `myInitHooksAndRawMeta.normalize()` or `normalizedMeta.initMeta.get(addSome)`.
 *
```ts
import { makeClassDecorator, AddDecorator, featureModule, InitHooksAndRawMeta } from '@ditsmod/core';

// Creating a decorator
export const addSome: AddDecorator<ArgumentsType, ReturnsType> = makeClassDecorator(getInitHooksAndRawMeta);

// Using the newly created decorator
\@addSome({ one: 1, two: 2 })
\@featureModule()
class MyModule {
  // Your code here
}

interface ArgumentsType {
  one?: number;
  two?: number;
}

interface ReturnsType {}

class MyInitHooksAndRawMeta extends InitHooksAndRawMeta<ArgumentsType> {}

export function getInitHooksAndRawMeta(data?: ArgumentsType): InitHooksAndRawMeta<ArgumentsType> {
  const metadata = Object.assign({}, data);
  return new MyInitHooksAndRawMeta(metadata);
}
```
 */
export interface AddDecorator<T extends { imports?: (ModRefId | { modRefId: ModRefId })[] }, R> {
  (data?: T): any;
}

export class NormalizedMeta<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj> {
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" array of `@featureModule` metadata.
   */
  modRefId: ModRefId<T>;
  /**
   * The module name.
   */
  name: string;
  /**
   * The module ID.
   */
  id?: string = '';
  decorator: AnyFn;
  /**
   * The directory in which the class was declared.
   */
  declaredInDir: string;
  /**
   * Indicates whether this module is external to the application.
   */
  isExternal: boolean;
  /**
   * Contains init hooks and raw metadata collected from init module decorators.
   */
  mInitHooksAndRawMeta = new Map<AnyFn, InitHooksAndRawMeta>();
  /**
   * Contains normalized metadata collected from module init decorators.
   */
  initMeta: InitMetaMap = new Map();
  /**
   * List of unique init hooks found in the current module and all imported modules.
   */
  allInitHooks: AllInitHooks = new Map();

  importsModules: ModuleType[] = [];
  importsWithParams: ModuleWithParams[] = [];
  providersPerApp: Provider[] = [];
  providersPerMod: Provider[] = [];
  exportsModules: ModuleType[] = [];
  exportsWithParams: ModuleWithParams[] = [];
  exportedProvidersPerMod: Provider[] = [];
  exportedMultiProvidersPerMod: MultiProvider[] = [];
  resolvedCollisionsPerApp: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerMod: [any, ModuleType | ModuleWithParams][] = [];
  extensionsProviders: Provider[] = [];
  exportedExtensionsProviders: Provider[] = [];
  aExtensionConfig: ExtensionConfig[] = [];
  aOrderedExtensions: ExtensionClass[] = [];
  aExportedExtensionConfig: ExtensionConfig[] = [];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta = {} as A;
}
