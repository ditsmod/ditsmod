import { InjectionToken } from '@ts-stack/di';

import { Extension, ExtensionProvider, ExtensionType } from '../types/mix';
import { isExtensionProvider } from './type-guards';

export class ExtensionObj {
  exports: any[];
  providers: ExtensionProvider[];
}

export type ExtensionItem1 = [
  groupToken: InjectionToken<Extension<any>[]>,
  nextToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
];

export type ExtensionItem2 = [
  groupToken: InjectionToken<Extension<any>[]>,
  extension: ExtensionType,
  exported?: boolean
];

export function getExtensionProvider(
  groupToken: InjectionToken<Extension<any>[]>,
  nextToken: InjectionToken<Extension<any>[]>,
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
  let nextToken: InjectionToken<Extension<any>[]> | undefined;
  let groupToken: InjectionToken<Extension<any>[]>;
  let extension: ExtensionType;
  let exported: boolean | undefined;

  if (typeof mayExported == 'boolean') {
    groupToken = someToken;
    nextToken = extensionOrGroupToken as InjectionToken<Extension<any>[]>;
    extension = extensionOrExported as ExtensionType;
    exported = mayExported;
  } else if (typeof extensionOrExported == 'boolean') {
    groupToken = someToken;
    extension = extensionOrGroupToken as ExtensionType;
    exported = extensionOrExported;
  } else if (isExtensionProvider(extensionOrExported!)) {
    groupToken = someToken;
    nextToken = extensionOrGroupToken as InjectionToken<Extension<any>[]>;
    extension = extensionOrExported;
  } else {
    groupToken = someToken;
    extension = extensionOrGroupToken as ExtensionType;
  }

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
