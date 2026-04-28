import { KeyRegistry, type Provider } from '#di';
import type { Extension, ExtensionClass } from '#extension/extension-types.js';
import type { ExtensionManager } from './extension-manager.js';
import type { AnyObj } from '#types/mix.js';
import type { GroupToken } from '#di/key-registry.js';

export class ExtensionObj {
  providers: Provider[];
  exportedProviders: Provider[];
  config?: ExtensionConfig;
  exportedConfig?: ExtensionConfig;
}

export interface ExtensionConfigBase {
  extension: ExtensionClass;
  /**
   * The array of extension classes before which this extension will be called.
   */
  beforeExtensions?: ExtensionClass[];
  /**
   * The array of extension classes after which this extension will be called.
   */
  afterExtensions?: ExtensionClass[];
  /**
   * Each element in this array will form a separate group of extensions together with the current extension.
   * When one of the extensions from this array is passed to {@link ExtensionManager.stage1 | ExtensionManager.stage1()},
   * it will return the result of the {@link Extension.stage1 | stage1()} method from each extension in the formed group.
   */
  groups?: ExtensionClass[];
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
  extension: ExtensionClass;
  overrideExtension: ExtensionClass;
}

export type ExtensionConfig = ExtensionConfig1 | ExtensionConfig2 | ExtensionConfig3;

export function isConfigWithOverrideExtension(extensionConfig: AnyObj): extensionConfig is ExtensionConfig3 {
  return (extensionConfig as ExtensionConfig3).overrideExtension !== undefined;
}

export function isBaseExtensionConfig(extensionConfig: AnyObj): extensionConfig is ExtensionConfigBase {
  return (extensionConfig as ExtensionConfigBase).extension !== undefined;
}

export function getExtensionProvider(
  extensionConfig: ExtensionConfig,
  mExtensionAsGroupToken: Map<ExtensionClass, GroupToken<any>>,
): ExtensionObj {
  if (isConfigWithOverrideExtension(extensionConfig)) {
    const { extension, overrideExtension } = extensionConfig;
    return {
      providers: [{ token: overrideExtension, useClass: extension }],
      exportedProviders: [],
    };
  }

  const providers: Provider[] = [extensionConfig.extension];

  // Creating a group of extensions using multi-providers
  extensionConfig.groups?.forEach((ext) => {
    const groupToken = KeyRegistry.getGroupToken(ext);
    if (!mExtensionAsGroupToken.has(ext)) {
      mExtensionAsGroupToken.set(ext, groupToken);
      providers.push({ token: groupToken, useToken: ext, multi: true });
    }
    providers.push({ token: groupToken, useToken: extensionConfig.extension, multi: true });
  });

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

export function getExtensionProviderList(
  extensionConfig: ExtensionConfig[],
  mExtensionAsGroupToken: Map<ExtensionClass, GroupToken<any>>,
) {
  const providers: Provider[] = [];
  extensionConfig.map((obj) => providers.push(...getExtensionProvider(obj, mExtensionAsGroupToken).providers));
  return providers;
}
