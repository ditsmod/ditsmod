import { Class, InjectionToken } from '#di';
import { AnyObj, Provider } from '#types/mix.js';

export class ExtensionsMetaPerApp {
  [key: string]: AnyObj;
}

export class ExtensionReturn<T> {
  extension: Extension<T>;
  result: T;
  delay: boolean;
  countdown: number;
}

export interface Extension<T> {
  init(isLastExtensionCall: boolean): Promise<T>;
}
export type ExtensionProvider = Provider;
export type ExtensionsGroupToken<T = any> = InjectionToken<Extension<T>[]> | `BEFORE ${string}`;
export type ExtensionType<T = any> = Class<Extension<T>>;

