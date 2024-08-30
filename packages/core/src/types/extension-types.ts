import { Class, BeforeToken, InjectionToken } from '#di';
import { AnyObj, Provider } from '#types/mix.js';

export class ExtensionsMetaPerApp {
  [key: string]: AnyObj;
}

/**
 * As a rule, an instance of this class is set in a variable named `groupInitMeta`.
 */
export class ExtensionInitMeta<T = any> {
  /**
   *
   * @param extension Instance of an extension.
   * @param payload Value that `extension` returns from its `init` method.
   * @param delay
   * @param countdown
   */
  constructor(
    public extension: Extension<T>,
    public payload: T,
    public delay: boolean,
    public countdown: number,
  ) {}
}

/**
 * As a rule, an instance of this class is set in a variable named `totalInitMeta`.
 */
export class ExtensionManagerInitMeta<T = any> {
  delay: boolean;
  countdown = 0;
  totalInitMetaPerApp?: ExtensionManagerInitMeta<T>[];
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
   * @param isLastModule Indicates whether this call is made in the last
   * module where this extension is imported or not.
   */
  init(isLastModule: boolean): Promise<T>;
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
