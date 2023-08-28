import { InjectionToken } from '#di';
import { AnyObj, Extension, ExtensionProvider, ExtensionType } from '#types/mix.js';

export class ExtensionObj {
  exports: any[];
  providers: ExtensionProvider[];
}

export interface ExtensionOptions1 {
  extension: ExtensionType;
  groupToken: InjectionToken<Extension<any>[]>;
  /**
   * The token of the group before which this extension will be called.
   */
  nextToken?: InjectionToken<Extension<any>[]>;
  /**
   * Indicates whether this extension needs to be exported.
   */
  exported?: boolean;
  overrideExtension?: never;
}

export interface ExtensionOptions2 {
  extension: ExtensionType;
  overrideExtension: ExtensionType;
}

export type ExtensionOptions = ExtensionOptions1 | ExtensionOptions2;

function isExtensionOptions(extensionOptions: AnyObj): extensionOptions is ExtensionOptions2 {
  return (extensionOptions as ExtensionOptions2).overrideExtension !== undefined;
}

export function getExtensionProvider(extensionOptions: ExtensionOptions): ExtensionObj {
  if (isExtensionOptions(extensionOptions)) {
    const { extension, overrideExtension } = extensionOptions;
    return {
      exports: [],
      providers: [{ token: overrideExtension, useClass: extension }],
    };
  } else if (extensionOptions.nextToken) {
    const { nextToken, exported, extension, groupToken } = extensionOptions;
    const exports = exported ? [extension, groupToken, `BEFORE ${nextToken}`] : [];
    return {
      exports,
      providers: [
        extension,
        { token: groupToken, useToken: extension, multi: true },
        { token: `BEFORE ${nextToken}`, useToken: extension, multi: true },
      ],
    };
  } else {
    const { exported, extension, groupToken } = extensionOptions;
    const exports = exported ? [extension, groupToken] : [];
    return {
      exports,
      providers: [extension, { token: groupToken, useToken: extension, multi: true }],
    };
  }
}
