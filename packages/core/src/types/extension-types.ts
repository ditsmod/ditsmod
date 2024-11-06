import { Class, BeforeToken, InjectionToken } from '#di';
import { AnyObj, OptionalProps, Provider } from '#types/mix.js';

export class ExtensionsMetaPerApp {
  [key: string]: AnyObj;
}

/**
 * As a rule, an instance of this class is set in a variable named `groupInitMeta`.
 */
export class ExtensionInitMeta<T = any> {
  /**
   * @param extension Instance of an extension.
   * @param payload Value that `extension` returns from its `init` method.
   */
  constructor(
    public extension: Extension<T>,
    public payload: T,
    public delay: boolean,
    public countdown: number,
  ) {}
}

export type TotalInitMetaPerApp<T = any> = Omit<TotalInitMeta<T>, 'totalInitMetaPerApp'>;
export type TotalInitMeta2<T = any> = OptionalProps<TotalInitMeta<T>, 'groupInitMeta' | 'moduleName' | 'countdown'>;

export class TotalInitMeta<T = any> {
  delay: boolean;
  countdown = 0;
  totalInitMetaPerApp: TotalInitMetaPerApp<T>[];
  /**
   *
   * @param groupInitMeta Array of `ExtensionInitMeta`.
   */
  constructor(
    public moduleName: string,
    public groupInitMeta: ExtensionInitMeta<T>[],
  ) {}
}

export interface Extension<T = any> {
  /**
   * This method is called at the stage when providers are dynamically added,
   * so any injector created at this stage may later be replaced by other extensions.
   *
   * @param isLastModule Indicates whether this call is made in the last
   * module where this extension is imported or not.
   */
  stage1(isLastModule: boolean): Promise<T>;
  /**
   * This method is called when the stage of dynamically adding providers has ended,
   * and the stage of creating injectors has begun.
   *
   * @param isLastModule Indicates whether this call is made in the last
   * module where this extension is imported or not.
   */
  stage2?(): Promise<void>;
  stage3?(): Promise<void>;
}
export type Stage = 'stage1' | 'stage2';
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
