import type { Extension, ExtensionClass } from '#extension/extension-types.js';
import type { ExtensionManager } from './extension-manager.js';
import type { AnyObj } from '#types/mix.js';
import { KeyRegistry, type GroupToken } from '#di/key-registry.js';
import type { Provider } from '#di/top/types-and-models.js';

export class NormalizedExtensionConfig {
  providers: Provider[];
  config?: ExtensionConfig;
  mGroupToken?: Map<ExtensionClass, GroupToken<any>>;

  exportedProviders: Provider[];
  exportedConfig?: ExtensionConfig;
  mExportedGroupToken?: Map<ExtensionClass, GroupToken<any>>;
}

export interface BaseExtensionConfig {
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

export interface ExportableExtensionConfig extends BaseExtensionConfig {
  /**
   * Indicates whether this extension needs to be export.
   */
  export?: boolean;
  exportOnly?: never;
}

export interface ExportOnlyExtensionConfig extends BaseExtensionConfig {
  export?: never;
  /**
   * Indicates whether this extension needs to be export without working in host module.
   */
  exportOnly?: boolean;
}

export interface OverrideExtensionConfig {
  extension: ExtensionClass;
  overrideExtension: ExtensionClass;
}

export type ExtensionConfig = ExportableExtensionConfig | ExportOnlyExtensionConfig | OverrideExtensionConfig;

export function isOverrideExtensionConfig(extensionConfig: AnyObj): extensionConfig is OverrideExtensionConfig {
  return (extensionConfig as OverrideExtensionConfig).overrideExtension !== undefined;
}

export function isStandardExtensionConfig(extensionConfig: AnyObj): extensionConfig is BaseExtensionConfig {
  return (extensionConfig as BaseExtensionConfig).extension !== undefined;
}

export function normalizeExtensionConfig(extensionConfig: ExtensionConfig): NormalizedExtensionConfig {
  if (isOverrideExtensionConfig(extensionConfig)) {
    const { extension, overrideExtension } = extensionConfig;
    return {
      providers: [{ token: overrideExtension, useClass: extension }],
      exportedProviders: [],
    };
  }

  const mGroupToken = new Map<ExtensionClass, GroupToken>();
  const providers: Provider[] = [extensionConfig.extension];

  // Creating a group of extensions using multi-providers
  extensionConfig.groups?.forEach((ext) => {
    const groupToken = KeyRegistry.getGroupToken(ext);
    mGroupToken.set(ext, groupToken);
    providers.push({ token: groupToken, useToken: extensionConfig.extension, multi: true });
  });

  if (extensionConfig.exportOnly) {
    return {
      providers: [],
      exportedProviders: providers,
      exportedConfig: extensionConfig,
      mExportedGroupToken: mGroupToken,
    };
  } else if (extensionConfig.export) {
    return {
      providers,
      exportedProviders: providers,
      config: extensionConfig,
      exportedConfig: extensionConfig,
      mGroupToken,
      mExportedGroupToken: mGroupToken,
    };
  } else {
    return {
      providers,
      exportedProviders: [],
      config: extensionConfig,
      mGroupToken,
    };
  }
}

export function getExtensionProviders(extensionConfig: ExtensionConfig[]) {
  const providers: Provider[] = [];
  extensionConfig.map((obj) => providers.push(...normalizeExtensionConfig(obj).providers));
  return providers;
}
