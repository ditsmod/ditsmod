import { InjectionToken, Provider } from '#di';
import { ExtensionType, Extension } from '#extension/extension-types.js';
import { AnyObj } from '#types/mix.js';

export class ExtensionObj {
  exportedProviders: Provider[];
  providers: Provider[];
  config?: ExtensionConfig;
  exportedConfig?: ExtensionConfig;
}

export interface ExtensionConfigBase {
  extension: ExtensionType;
  /**
   * Extension group token.
   */
  group: InjectionToken<Extension[]>;
  /**
   * The array of tokens of the group before which this extension will be called.
   */
  beforeGroups?: InjectionToken<Extension[]>[];
  /**
   * The array of tokens of the group after which this extension will be called.
   */
  afterGroups?: InjectionToken<Extension[]>[];
  overrideExtension?: never;
}

export interface ExtensionConfig1 extends ExtensionConfigBase {
  /**
   * Indicates whether this extension needs to be export.
   */
  export?: boolean;
  exportOnly?: never;
}

export interface ExtensionConfig2 extends ExtensionConfigBase {
  export?: never;
  /**
   * Indicates whether this extension needs to be export without working in host module.
   */
  exportOnly?: boolean;
}

export interface ExtensionConfig3 {
  extension: ExtensionType;
  overrideExtension: ExtensionType;
}

export type ExtensionConfig = ExtensionConfig1 | ExtensionConfig2 | ExtensionConfig3;

export function isConfigWithOverrideExtension(extensionConfig: AnyObj): extensionConfig is ExtensionConfig3 {
  return (extensionConfig as ExtensionConfig3).overrideExtension !== undefined;
}

export function isBaseExtensionConfig(extensionConfig: AnyObj): extensionConfig is ExtensionConfigBase {
  return (extensionConfig as ExtensionConfigBase).group !== undefined;
}

export function getExtensionProvider(extensionConfig: ExtensionConfig): ExtensionObj {
  if (isConfigWithOverrideExtension(extensionConfig)) {
    const { extension, overrideExtension } = extensionConfig;
    return {
      providers: [{ token: overrideExtension, useClass: extension }],
      exportedProviders: [],
    };
  }

  const { extension } = extensionConfig;
  const providers: Provider[] = [extension];
  if (extensionConfig.group) {
    providers.push({ token: extensionConfig.group, useToken: extension, multi: true });
  }

  if (extensionConfig.exportOnly) {
    return {
      providers: [],
      exportedProviders: providers,
      exportedConfig: extensionConfig,
    };
  } else if (extensionConfig.export) {
    return {
      providers,
      exportedProviders: providers,
      config: extensionConfig,
      exportedConfig: extensionConfig,
    };
  } else {
    return {
      providers,
      exportedProviders: [],
      config: extensionConfig,
    };
  }
}

export function getExtensionProviderList(extensionConfig: ExtensionConfig[]) {
  const providers: Provider[] = [];
  extensionConfig.map((obj) => providers.push(...getExtensionProvider(obj).providers));
  return providers;
}
