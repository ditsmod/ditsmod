import { MultiProvider } from '#di';
import { AnyFn, AnyObj, ModuleType } from '#types/mix.js';
import { Provider } from '#di/types-and-models.js';
import { ModuleWithParams } from './module-metadata.js';
import { ExtensionConfig } from '#extension/get-extension-provider.js';
import { ExtensionClass } from '#extension/extension-types.js';
import { InitHooksAndMetadata } from '#decorators/feature-module.js';

export class NormDecorMeta extends Map {
  override set<T>(key: AddDecorator<any, T>, value: T) {
    return super.set(key, value);
  }

  override get<T>(key: AddDecorator<any, T>): T | undefined {
    return super.get(key) as T | undefined;
  }
}

/**
 * Use this interface to create decorators with init hooks.
 * 
 * ### Complete example with init hooks
 * 
 * In this example, `ReturnsType` is the type that will be returned by
 * `myInitHooksAndMetadata.normalize()` or `normalizedMeta.normDecorMeta.get(addSome)`.
 *
```ts
import { makeClassDecorator, AddDecorator, featureModule, InitHooksAndMetadata } from '@ditsmod/core';

// Creating a decorator
export const addSome: AddDecorator<ArgumentsType, ReturnsType> = makeClassDecorator(getInitHooksAndMetadata);

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

class MyInitHooksAndMetadata extends InitHooksAndMetadata<ArgumentsType> {}

export function getInitHooksAndMetadata(data?: ArgumentsType): InitHooksAndMetadata<ArgumentsType> {
  const metadata = Object.assign({}, data);
  return new MyInitHooksAndMetadata(metadata);
}
```
 */
export interface AddDecorator<A, R> {
  (data?: A): any;
}

export class NormalizedMeta<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj> {
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" array of `@featureModule` metadata.
   */
  modRefId: ModuleType<T> | ModuleWithParams<T>;
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
   * Contains raw metadata collected from init module decorators.
   */
  rawDecorMeta = new Map<AnyFn, InitHooksAndMetadata<AnyObj>>();
  /**
   * Contains normalized metadata collected from init module decorators.
   */
  normDecorMeta = new NormDecorMeta();

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
