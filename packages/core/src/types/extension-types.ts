import { Class, BeforeToken, InjectionToken } from '#di';
import { AnyObj, Provider } from '#types/mix.js';

export class ExtensionsMetaPerApp {
  [key: string]: AnyObj;
}

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

export class ExtensionManagerInitMeta {
  public delay?: boolean;
  public countdown = 0;

  constructor(public initMeta: ExtensionInitMeta[]) {}
}

export interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}
export type ExtensionProvider = Provider;
export type ExtensionsGroupToken<T = any> = InjectionToken<Extension<T>[]> | BeforeToken<Extension<T>[]>;
export type ExtensionType<T = any> = Class<Extension<T>>;
