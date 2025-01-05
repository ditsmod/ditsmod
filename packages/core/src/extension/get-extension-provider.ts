import { KeyRegistry, InjectionToken, Provider } from '#di';
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
   * The token of the group before which this extension will be called. Use this option
   * only if the extension group you place here does not expect your extension group to work.
   */
  beforeGroup?: InjectionToken<Extension[]>;
  overrideExtension?: never;
}

export interface ExtensionConfig1 extends ExtensionConfigBase {
  /**
   * Indicates whether this extension needs to be exported.
   */
  exported?: boolean;
  exportedOnly?: never;
}

export interface ExtensionConfig2 extends ExtensionConfigBase {
  exported?: never;
  /**
   * Indicates whether this extension needs to be exported without working in host module.
   */
  exportedOnly?: boolean;
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
  if (extensionConfig.beforeGroup) {
    const token = KeyRegistry.getBeforeToken(extensionConfig.beforeGroup);
    providers.push({ token, useToken: extension, multi: true });
  }

  if (extensionConfig.exportedOnly) {
    return {
      providers: [],
      exportedProviders: providers,
      exportedConfig: extensionConfig,
    };
  } else if (extensionConfig.exported) {
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
