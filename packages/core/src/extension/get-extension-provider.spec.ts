import { describe, expect, it } from 'vitest';

import { KeyRegistry, InjectionToken, Provider } from '#di';
import { Extension } from '#extension/extension-types.js';
import { ExtensionConfig, getExtensionProvider } from '#extension/get-extension-provider.js';

describe('getExtensionProvider', () => {
  const MY_EXTENSION = new InjectionToken('MY_EXTENSION');
  const OTHER_EXTENSION = new InjectionToken('OTHER_EXTENSION');
  class Extension1 implements Extension {
    async stage1() {}
  }
  class Extension2 implements Extension {
    async stage1() {}
  }

  describe('without BEFORE group', () => {
    const providers: Provider[] = [Extension1, { token: MY_EXTENSION, useToken: Extension1, multi: true }];

    it('extension without exports (two arguments)', () => {
      const args: ExtensionConfig = { extension: Extension1, group: MY_EXTENSION };
      expect(getExtensionProvider(args)).toMatchObject({
        exportedProviders: [],
        providers,
      });
    });

    it('extension with override', () => {
      const args: ExtensionConfig = { extension: Extension2, overrideExtension: Extension1 };
      const providers: Provider[] = [{ token: Extension1, useClass: Extension2 }];
      expect(getExtensionProvider(args)).toMatchObject({
        exportedProviders: [],
        providers,
      });
    });

    it('extension without exports (three arguments)', () => {
      const args: ExtensionConfig = { extension: Extension1, group: MY_EXTENSION, export: false };
      expect(getExtensionProvider(args)).toMatchObject({
        exportedProviders: [],
        providers,
      });
    });

    it('extension with exports', () => {
      const args: ExtensionConfig = { extension: Extension1, group: MY_EXTENSION, export: true };
      expect(getExtensionProvider(args)).toMatchObject({
        exportedProviders: providers,
        providers,
      });
    });
  });
});
