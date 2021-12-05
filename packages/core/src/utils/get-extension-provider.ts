import { ExtensionsGroupToken, ExtensionsProvider, ExtensionType } from '../types/mix';

// prettier-ignore
export function getExtensionProviders(beforeToken: ExtensionsGroupToken, groupToken: ExtensionsGroupToken, extension: ExtensionType): ExtensionsProvider[];
// prettier-ignore
export function getExtensionProviders(groupToken: ExtensionsGroupToken, extension: ExtensionType): ExtensionsProvider[];

export function getExtensionProviders(
  someToken: ExtensionsGroupToken,
  extensionOrGroupToken: ExtensionType | ExtensionsGroupToken,
  mayExtension?: ExtensionType
): ExtensionsProvider[] {
  let beforeToken: ExtensionsGroupToken | undefined;
  let groupToken: ExtensionsGroupToken;
  let extension: ExtensionType;

  if (mayExtension) {
    beforeToken = someToken;
    groupToken = extensionOrGroupToken as ExtensionsGroupToken;
    extension = mayExtension;
  } else {
    groupToken = someToken;
    extension = extensionOrGroupToken as ExtensionType;
  }

  if (beforeToken) {
    return [
      extension,
      { provide: groupToken, useExisting: extension, multi: true },
      { provide: `BEFORE ${beforeToken}`, useExisting: extension, multi: true },
    ];
  } else {
    return [{ provide: groupToken, useClass: extension, multi: true }];
  }
}
