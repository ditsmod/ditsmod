import type { AnyObj, OptionalProps } from '#types/mix.js';
import type { Class, Provider } from '#di/top/types-and-models.js';
import type { Injector } from '#di/injector.js';

export class ExtensionMetaMap {
  [key: string]: AnyObj;
}

export class ExtensionDebugMeta<T = any> {
  /**
   * @param extension Instance of an extension.
   * @param payload Value that `extension` returns from its `stage1` method.
   */
  constructor(
    public extension: Extension<T>,
    public payload: T,
    public delay: boolean,
    public countdown: number,
  ) {}
}

export class ExtensionGroupMeta<T = any> {
  delay: boolean;
  countdown = 0;
  groupDataPerApp: AppExtensionGroupMeta<T>[];

  constructor(
    public moduleName: string,
    public groupDebugMeta: ExtensionDebugMeta<T>[],
    public groupData: T[],
  ) {}
}

export class InternalExtensionGroupMeta<T = any> extends ExtensionGroupMeta<T> {
  addDebugMeta(debugMeta: ExtensionDebugMeta<T>) {
    this.groupDebugMeta.push(debugMeta);
    this.groupData.push(debugMeta.payload);
  }
}

// prettier-ignore
export type PartialExtensionGroupMeta<T = any> = OptionalProps<ExtensionGroupMeta<T>, 'groupDebugMeta' | 'groupData' | 'moduleName' | 'countdown'>;
export type AppExtensionGroupMeta<T = any> = Omit<ExtensionGroupMeta<T>, 'groupDataPerApp'>;

/**
 * The concept of "stages" in extensions was introduced so that metadata or injectors
 * from another module could be accessed in the current module without being tied
 * to a particular group of extensions. The method of the next stage is not triggered
 * until all modules in the application have completed the current stage.
 *
 * The order of extension execution in a given module at the second and third stages
 * is exactly the same as at the first stage.
 */
export interface Extension<T = any> {
  /**
   * This method is called at the stage when providers are dynamically added.
   *
   * @param isLastModule Indicates whether this call is made in the last
   * module where this extension is imported or not.
   */
  stage1?(isLastModule: boolean): Promise<T>;
  /**
   * This method is called after the `stage1()` method has executed for all modules
   * in the application and this method takes a module-level injector as an argument.
   */
  stage2?(injectorPerMod: Injector): Promise<void>;
  /**
   * This method is called after the `stage2()` method has executed for all modules
   * in the application. There is no strict role for this method.
   */
  stage3?(): Promise<void>;
}
export type ExtensionClass<T = any> = Class<Extension<T>>;
/**
 * Used to count all extension groups and extensions that are in the application.
 */
export class ExtensionCounters {
  mExtensions = new Map<Provider, number>();
}
