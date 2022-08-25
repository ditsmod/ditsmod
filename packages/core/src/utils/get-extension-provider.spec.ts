import { InjectionToken } from '@ts-stack/di';
import { it, jest, describe, beforeEach, expect, xdescribe } from '@jest/globals';

import { Extension, ExtensionProvider } from '../types/mix';
import { ExtensionItem1, ExtensionItem2, ExtensionObj, getExtensionProvider } from './get-extension-provider';

describe('getExtensionProviders', () => {
  const MY_EXTENSION = new InjectionToken('MY_EXTENSION');
  const OTHER_EXTENSION = new InjectionToken('OTHER_EXTENSION');
  class Extension1 implements Extension<any> {
    async init() {}
  }

  describe('without BEFORE group', () => {
    const providers: ExtensionProvider[] = [{ provide: MY_EXTENSION, useClass: Extension1, multi: true }];

    it('extension without exports (two arguments)', () => {
      const args: ExtensionItem2 = [MY_EXTENSION, Extension1];
      expect(getExtensionProvider(...args)).toEqual({
        exports: [],
        providers,
      });
    });

    it('extension without exports (three arguments)', () => {
      const args: ExtensionItem2 = [MY_EXTENSION, Extension1, false];
      expect(getExtensionProvider(...args)).toEqual({
        exports: [],
        providers,
      });
    });

    it('extension with exports', () => {
      const args: ExtensionItem2 = [MY_EXTENSION, Extension1, true];
      expect(getExtensionProvider(...args)).toEqual({
        exports: [MY_EXTENSION],
        providers,
      });
    });
  });

  describe('with BEFORE group', () => {
    const providers: ExtensionProvider[] = [
      Extension1,
      { provide: MY_EXTENSION, useExisting: Extension1, multi: true },
      { provide: `BEFORE ${OTHER_EXTENSION}`, useExisting: Extension1, multi: true },
    ];

    it('extension without exports (three arguments)', () => {
      const args: ExtensionItem1 = [MY_EXTENSION, OTHER_EXTENSION, Extension1];
      expect(getExtensionProvider(MY_EXTENSION, OTHER_EXTENSION, Extension1)).toEqual({
        exports: [],
        providers,
      });
    });

    it('extension without exports (foure arguments)', () => {
      const args: ExtensionItem1 = [MY_EXTENSION, OTHER_EXTENSION, Extension1, false];
      expect(getExtensionProvider(...args)).toEqual({
        exports: [],
        providers,
      });
    });

    it('extension with exports', () => {
      const args: ExtensionItem1 = [MY_EXTENSION, OTHER_EXTENSION, Extension1, true];
      expect(getExtensionProvider(...args)).toEqual({
        exports: [Extension1, MY_EXTENSION, `BEFORE ${OTHER_EXTENSION}`],
        providers,
      });
    });
  });
});
