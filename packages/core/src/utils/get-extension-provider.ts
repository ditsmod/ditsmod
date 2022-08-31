import { InjectionToken } from '@ts-stack/di';

import { Extension, ExtensionProvider, ExtensionType } from '../types/mix';

export class ExtensionObj {
  exports: any[];
  providers: ExtensionProvider[];
}

export class ExtensionOptions {
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
}

export function getExtensionProvider(extensionOptions: ExtensionOptions): ExtensionObj {
  const { nextToken, exported, extension, groupToken } = extensionOptions;
  if (nextToken) {
    const exports = exported ? [extension, groupToken, `BEFORE ${nextToken}`] : [];
    return {
      exports,
      providers: [
        extension,
        { provide: groupToken, useExisting: extension, multi: true },
        { provide: `BEFORE ${nextToken}`, useExisting: extension, multi: true },
      ],
    };
  } else {
    const exports = exported ? [groupToken] : [];
    return { exports, providers: [{ provide: groupToken, useClass: extension, multi: true }] };
  }
}
