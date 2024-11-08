import { Class, BeforeToken, InjectionToken } from '#di';
import { AnyObj, OptionalProps, Provider } from '#types/mix.js';

export class ExtensionsMetaPerApp {
  [key: string]: AnyObj;
}

/**
 * As a rule, an instance of this class is set in a variable named `aExtStage1Meta`.
 */
export class ExtensionStage1Meta<T = any> {
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

export class TotalStage1Meta<T = any> {
  delay: boolean;
  countdown = 0;
  totalStage1MetaPerApp: TotalStage1MetaPerApp<T>[];
  /**
   *
   * @param aExtStage1Meta Array of `ExtensionStage1Meta`.
   */
  constructor(
    public moduleName: string,
    public aExtStage1Meta: ExtensionStage1Meta<T>[],
  ) {}
}

export type TotalStage1Meta2<T = any> = OptionalProps<TotalStage1Meta<T>,'aExtStage1Meta' | 'moduleName' | 'countdown'>;
export type TotalStage1MetaPerApp<T = any> = Omit<TotalStage1Meta<T>, 'totalStage1MetaPerApp'>;

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
   * in the application. There is no strict role for this method.
   */
  stage2?(): Promise<void>;
  /**
   * This method is called after the `stage2()` method has executed for all modules
   * in the application. There is no strict role for this method.
   */
  stage3?(): Promise<void>;
}
export type ExtensionProvider = Provider;
export type ExtensionsGroupToken<T = any> = InjectionToken<Extension<T>[]> | BeforeToken<Extension<T>[]>;
export type ExtensionType<T = any> = Class<Extension<T>>;
/**
 * Used to count all extension groups and extensions that are in the application.
 */
export class ExtensionCounters {
  mExtensions = new Map<Provider, number>();
  mGroupTokens = new Map<ExtensionsGroupToken, number>();
}
