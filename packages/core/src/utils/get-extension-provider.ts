import { InjectionToken } from '@ts-stack/di';

import { Extension, ExtensionsProvider, ExtensionType } from '../types/mix';
import { isExtensionProvider } from './type-guards';

export class ExtensionObj {
  exports: any[];
  providers: ExtensionsProvider[];
}

export type ExtensionItem1 = [
  beforeToken: InjectionToken<Extension<any>[]>,
  groupToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
];

export type ExtensionItem2 = [
  groupToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
];

export function getExtensionProvider(
  beforeToken: InjectionToken<Extension<any>[]>,
  groupToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
): ExtensionObj;

export function getExtensionProvider(
  groupToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
): ExtensionObj;

export function getExtensionProvider(
  someToken: InjectionToken<Extension<any>[]>,
  extensionOrGroupToken: ExtensionType | InjectionToken<Extension<any>[]>,
  extensionOrExported?: ExtensionType | boolean,
  mayExported?: boolean
): ExtensionObj {
  let beforeToken: InjectionToken<Extension<any>[]> | undefined;
  let groupToken: InjectionToken<Extension<any>[]>;
  let extension: ExtensionType;
  let exported: boolean | undefined;

  if (typeof mayExported == 'boolean') {
    beforeToken = someToken;
    groupToken = extensionOrGroupToken as InjectionToken<Extension<any>[]>;
    extension = extensionOrExported as ExtensionType;
    exported = mayExported;
  } else if (typeof extensionOrExported == 'boolean') {
    groupToken = someToken;
    extension = extensionOrGroupToken as ExtensionType;
    exported = extensionOrExported;
  } else if (isExtensionProvider(extensionOrExported!)) {
    beforeToken = someToken;
    groupToken = extensionOrGroupToken as InjectionToken<Extension<any>[]>;
    extension = extensionOrExported;
  } else {
    groupToken = someToken;
    extension = extensionOrGroupToken as ExtensionType;
  }

  if (beforeToken) {
    const exports = exported ? [extension, groupToken, `BEFORE ${beforeToken}`] : [];
    return {
      exports,
      providers: [
        extension,
        { provide: groupToken, useExisting: extension, multi: true },
        { provide: `BEFORE ${beforeToken}`, useExisting: extension, multi: true },
      ],
    };
  } else {
    const exports = exported ? [groupToken] : [];
    return { exports, providers: [{ provide: groupToken, useClass: extension, multi: true }] };
  }
}
