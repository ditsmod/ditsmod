import { KeyRegistry, InjectionToken } from '#di';
import { ExtensionProvider, Extension } from '#types/extension-types.js';
import { ExtensionOptions, getExtensionProvider } from './get-extension-provider.js';

describe('getExtensionProvider', () => {
  const MY_EXTENSION = new InjectionToken('MY_EXTENSION');
  const OTHER_EXTENSION = new InjectionToken('OTHER_EXTENSION');
  class Extension1 implements Extension {
    async init() {}
  }
  class Extension2 implements Extension {
    async init() {}
  }

  describe('without BEFORE group', () => {
    const providers: ExtensionProvider[] = [Extension1, { token: MY_EXTENSION, useToken: Extension1, multi: true }];

    it('extension without exports (two arguments)', () => {
      const args: ExtensionOptions = { extension: Extension1, groupToken: MY_EXTENSION };
      expect(getExtensionProvider(args)).toEqual({
        exports: [],
        providers,
      });
    });

    it('extension with override', () => {
      const args: ExtensionOptions = { extension: Extension2, overrideExtension: Extension1 };
      const providers: ExtensionProvider[] = [{ token: Extension1, useClass: Extension2 }];
      expect(getExtensionProvider(args)).toEqual({
        exports: [],
        providers,
      });
    });

    it('extension without exports (three arguments)', () => {
      const args: ExtensionOptions = { extension: Extension1, groupToken: MY_EXTENSION, exported: false };
      expect(getExtensionProvider(args)).toEqual({
        exports: [],
        providers,
      });
    });

    it('extension with exports', () => {
      const args: ExtensionOptions = { extension: Extension1, groupToken: MY_EXTENSION, exported: true };
      expect(getExtensionProvider(args)).toEqual({
        exports: [Extension1, MY_EXTENSION],
        providers,
      });
    });
  });

  describe('with BEFORE group', () => {
    const providers: ExtensionProvider[] = [
      Extension1,
      { token: MY_EXTENSION, useToken: Extension1, multi: true },
      { token: KeyRegistry.getBeforeToken(OTHER_EXTENSION), useToken: Extension1, multi: true },
    ];

    it('extension without exports (three arguments)', () => {
      const args: ExtensionOptions = { extension: Extension1, groupToken: MY_EXTENSION, nextToken: OTHER_EXTENSION };
      expect(getExtensionProvider(args)).toEqual({
        exports: [],
        providers,
      });
    });

    it('extension without exports (foure arguments)', () => {
      const args: ExtensionOptions = {
        extension: Extension1,
        groupToken: MY_EXTENSION,
        nextToken: OTHER_EXTENSION,
        exported: false,
      };
      expect(getExtensionProvider(args)).toEqual({
        exports: [],
        providers,
      });
    });

    it('extension with exports', () => {
      const args: ExtensionOptions = {
        extension: Extension1,
        groupToken: MY_EXTENSION,
        nextToken: OTHER_EXTENSION,
        exported: true,
      };
      expect(getExtensionProvider(args)).toEqual({
        exports: [Extension1, MY_EXTENSION, KeyRegistry.getBeforeToken(OTHER_EXTENSION)],
        providers,
      });
    });
  });
});
