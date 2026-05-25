import type { Extension } from '#extension/extension-types.js';
import type { ExtensionConfig} from '#extension/extension-providers-and-configs.js';
import { normalizeExtensionConfig } from '#extension/extension-providers-and-configs.js';
import type { Provider } from '#di/top/types-and-models.js';

describe('getExtensionProvider', () => {
  class Extension1 implements Extension {
    async stage1() {}
  }
  class Extension2 implements Extension {
    async stage1() {}
  }

  describe('without BEFORE group', () => {
    const providers: Provider[] = [Extension1];

    it('extension without exports (two arguments)', () => {
      const args: ExtensionConfig = { extension: Extension1 };
      expect(normalizeExtensionConfig(args)).toMatchObject({
        exportedProviders: [],
        providers,
      });
    });

    it('extension with override', () => {
      const args: ExtensionConfig = { extension: Extension2, overrideExtension: Extension1 };
      const providers: Provider[] = [{ token: Extension1, useClass: Extension2 }];
      expect(normalizeExtensionConfig(args)).toMatchObject({
        exportedProviders: [],
        providers,
      });
    });

    it('extension without exports (three arguments)', () => {
      const args: ExtensionConfig = { extension: Extension1, export: false };
      expect(normalizeExtensionConfig(args)).toMatchObject({
        exportedProviders: [],
        providers,
      });
    });

    it('extension with exports', () => {
      const args: ExtensionConfig = { extension: Extension1, export: true };
      expect(normalizeExtensionConfig(args)).toMatchObject({
        exportedProviders: providers,
        providers,
      });
    });
  });
});
