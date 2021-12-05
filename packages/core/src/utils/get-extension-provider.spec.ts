import { InjectionToken } from '@ts-stack/di';

import { Extension, ExtensionsProvider } from '../types/mix';
import { ExtensionObj, getExtensionProvider } from './get-extension-provider';

describe('getExtensionProviders', () => {
  const MY_EXTENSION = new InjectionToken('MY_EXTENSION');
  const OTHER_EXTENSION = new InjectionToken('OTHER_EXTENSION');
  class Extension1 implements Extension<any> {
    async init() {}
  }

  describe('without BEFORE group', () => {
    const providers: ExtensionsProvider[] = [{ provide: MY_EXTENSION, useClass: Extension1, multi: true }];

    it('extension without exports (two arguments)', () => {
      expect(getExtensionProvider(MY_EXTENSION, Extension1)).toEqual<ExtensionObj>({
        exports: [],
        providers,
      });
    });

    it('extension without exports (three arguments)', () => {
      expect(getExtensionProvider(MY_EXTENSION, Extension1, false)).toEqual<ExtensionObj>({
        exports: [],
        providers,
      });
    });

    it('extension with exports', () => {
      expect(getExtensionProvider(MY_EXTENSION, Extension1, true)).toEqual<ExtensionObj>({
        exports: [MY_EXTENSION],
        providers,
      });
    });
  });

  describe('with BEFORE group', () => {
    const providers: ExtensionsProvider[] = [
      Extension1,
      { provide: MY_EXTENSION, useExisting: Extension1, multi: true },
      { provide: `BEFORE ${OTHER_EXTENSION}`, useExisting: Extension1, multi: true },
    ];

    it('extension without exports (three arguments)', () => {
      expect(getExtensionProvider(OTHER_EXTENSION, MY_EXTENSION, Extension1)).toEqual<ExtensionObj>({
        exports: [],
        providers,
      });
    });

    it('extension without exports (foure arguments)', () => {
      expect(getExtensionProvider(OTHER_EXTENSION, MY_EXTENSION, Extension1, false)).toEqual<ExtensionObj>({
        exports: [],
        providers,
      });
    });

    it('extension with exports', () => {
      expect(getExtensionProvider(OTHER_EXTENSION, MY_EXTENSION, Extension1, true)).toEqual<ExtensionObj>({
        exports: [Extension1, MY_EXTENSION, `BEFORE ${OTHER_EXTENSION}`],
        providers,
      });
    });
  });
});
