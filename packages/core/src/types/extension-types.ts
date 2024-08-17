import { Class, BeforeToken, InjectionToken } from '#di';
import { AnyObj, Provider } from '#types/mix.js';

export class ExtensionsMetaPerApp {
  [key: string]: AnyObj;
}

export class ExtensionManagerInitReturn<T> {
  constructor(
    public extension: Class<Extension<T>>,
    public result: T,
    public delay: boolean,
    public countdown: number,
  ) {}
}

export interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}
export type ExtensionProvider = Provider;
export type ExtensionsGroupToken<T = any> = InjectionToken<Extension<T>[]> | BeforeToken<Extension<T>[]>;
export type ExtensionType<T = any> = Class<Extension<T>>;
