import { KeyRegistry, InjectionToken, Provider } from '#di';
import { ExtensionType, ExtensionProvider, Extension } from '#extension/extension-types.js';

export class ExtensionObj {
  exportedOnly?: boolean;
  exports: any[];
  providers: ExtensionProvider[];
}

export interface ExtensionOptionsBase {
  extension: ExtensionType;
  /**
   * Extension group token.
   */
  token: InjectionToken<Extension[]>;
  /**
   * The token of the group before which this extension will be called. Use this option
   * only if the extension group you place here does not expect your extension group to work.
   */
  nextToken?: InjectionToken<Extension[]>;
  overrideExtension?: never;
}

export interface ExtensionOptions1 extends ExtensionOptionsBase {
  /**
   * Indicates whether this extension needs to be exported.
   */
  exported?: boolean;
  exportedOnly?: never;
}

export interface ExtensionOptions2 extends ExtensionOptionsBase {
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

export type ExtensionOptions = ExtensionOptions1 | ExtensionOptions2 | ExtensionOptions3;

export function isOptionWithOverrideExtension(extensionOptions: ExtensionOptions): extensionOptions is ExtensionOptions3 {
  return (extensionOptions as ExtensionOptions3).overrideExtension !== undefined;
}

function isExportedOnlyExtension(extensionOptions: ExtensionOptions): extensionOptions is ExtensionOptions2 {
  return Boolean((extensionOptions as ExtensionOptions2).exportedOnly);
}

export function getExtensionProvider(extensionOptions: ExtensionOptions): ExtensionObj {
  if (isOptionWithOverrideExtension(extensionOptions)) {
    const { extension, overrideExtension } = extensionOptions;
    return {
      exports: [],
      providers: [{ token: overrideExtension, useClass: extension }],
    };
  } else if (extensionOptions.nextToken) {
    const { nextToken, exported, exportedOnly, extension, token: groupToken } = extensionOptions;
    const beforeGroupToken = KeyRegistry.getBeforeToken(nextToken);
    const exports = exported || exportedOnly ? [extension, groupToken, beforeGroupToken] : [];
    return {
      exportedOnly,
      exports,
      providers: [
        extension,
        { token: groupToken, useToken: extension, multi: true },
        { token: beforeGroupToken, useToken: extension, multi: true },
      ],
    };
  } else {
    const { exported, exportedOnly, extension, token: groupToken } = extensionOptions;
    const exports = exported || exportedOnly ? [extension, groupToken] : [];
    return {
      exportedOnly,
      exports,
      providers: [extension, { token: groupToken, useToken: extension, multi: true }],
    };
  }
}

export function getExtensionProviderList(extensionOptions: ExtensionOptions[]) {
  const providers: Provider[] = [];
  extensionOptions.map((obj) => providers.push(...getExtensionProvider(obj).providers));
  return providers;
}
