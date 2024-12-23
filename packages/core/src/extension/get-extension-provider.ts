import { KeyRegistry, InjectionToken, Provider } from '#di';
import { ExtensionType, Extension } from '#extension/extension-types.js';
import { AnyObj } from '#types/mix.js';

export class ExtensionObj {
  exportedProviders: Provider[];
  providers: Provider[];
  options?: ExtensionOptions;
  exportedOptions?: ExtensionOptions;
}

interface ExtensionOptionsBase {
  extension: ExtensionType;
  overrideExtension?: never;
}

interface ExtensionOptions1 extends ExtensionOptionsBase {
  /**
   * Indicates whether this extension needs to be exported.
   */
  exported?: boolean;
  exportedOnly?: never;
}

interface ExtensionOptions2 extends ExtensionOptionsBase {
  exported?: never;
  /**
   * Indicates whether this extension needs to be exported without working in host module.
   */
  exportedOnly?: boolean;
}

export interface ExtensionOptions3 {
  extension: ExtensionType;
  overrideExtension: ExtensionType;
}

export interface ExtensionOptions4 extends ExtensionOptions1 {
  group: InjectionToken<Extension[]>;
  beforeGroup?: InjectionToken<Extension[]>;
}

export interface ExtensionOptions5 extends ExtensionOptions1 {
  group?: InjectionToken<Extension[]>;
  beforeGroup: InjectionToken<Extension[]>;
}

export interface ExtensionOptions6 extends ExtensionOptions2 {
  group: InjectionToken<Extension[]>;
  beforeGroup?: InjectionToken<Extension[]>;
}

export interface ExtensionOptions7 extends ExtensionOptions2 {
  group?: InjectionToken<Extension[]>;
  beforeGroup: InjectionToken<Extension[]>;
}

export type ExtensionOptions =
  | ExtensionOptions3
  | ExtensionOptions4
  | ExtensionOptions5
  | ExtensionOptions6
  | ExtensionOptions7;

export function isOptionWithOverrideExtension(extensionOptions: AnyObj): extensionOptions is ExtensionOptions3 {
  return (extensionOptions as ExtensionOptions3).overrideExtension !== undefined;
}

export function getExtensionProvider(extensionOptions: ExtensionOptions): ExtensionObj {
  if (isOptionWithOverrideExtension(extensionOptions)) {
    const { extension, overrideExtension } = extensionOptions;
    return {
      providers: [{ token: overrideExtension, useClass: extension }],
      exportedProviders: [],
    };
  }

  const { extension } = extensionOptions;
  const providers: Provider[] = [extension];
  if (extensionOptions.group) {
    providers.push({ token: extensionOptions.group, useToken: extension, multi: true });
  }
  if (extensionOptions.beforeGroup) {
    const token = KeyRegistry.getBeforeToken(extensionOptions.beforeGroup);
    providers.push({ token, useToken: extension, multi: true });
  }

  if (extensionOptions.exportedOnly) {
    return {
      providers: [],
      exportedProviders: providers,
      exportedOptions: extensionOptions,
    };
  } else if (extensionOptions.exported) {
    return {
      providers,
      exportedProviders: providers,
      options: extensionOptions,
      exportedOptions: extensionOptions,
    };
  } else {
    return {
      providers,
      exportedProviders: [],
      options: extensionOptions,
    };
  }
}

export function getExtensionProviderList(extensionOptions: ExtensionOptions[]) {
  const providers: Provider[] = [];
  extensionOptions.map((obj) => providers.push(...getExtensionProvider(obj).providers));
  return providers;
}
