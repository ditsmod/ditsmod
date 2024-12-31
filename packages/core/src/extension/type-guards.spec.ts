import { describe, expect, it } from 'vitest';

import { isExtensionProvider } from '#extension/type-guards.js';
import { Extension } from '#extension/extension-types.js';

describe('core type guards', () => {
  it('isExtensionProvider()', () => {
    class Extension1 implements Extension {
      async stage1(isLastModule: boolean) {}
    }
    class FakeExtension {
      async sage1(isLastModule: boolean) {}
    }

    expect(isExtensionProvider(Extension1)).toBe(true);
    expect(isExtensionProvider(FakeExtension)).toBe(false);
  });
});
