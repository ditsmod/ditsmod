import { describe, expect, it, beforeEach } from 'vitest';

import { injectable, Injector } from '#di';
import { Extension, ExtensionCounters } from '#extension/extension-types.js';
import { getExtensionProviderList } from '#extension/get-extension-provider.js';
import { defaultProvidersPerApp } from '#init/default-providers-per-app.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { StageIteration, ExtensionsManager } from '#extension/extensions-manager.js';

describe('ExtensionsManager', () => {
  describe('stage1', () => {});

  describe('circular dependencies', () => {
    class MockExtensionsManager extends ExtensionsManager {
      override stageIterationMap = new Map();
      override currStageIteration = new StageIteration(0);
    }

    let mock: MockExtensionsManager;

    @injectable()
    class Extension3 implements Extension {
      constructor(public mockExtensionsManager: MockExtensionsManager) {}

      async stage1() {
        await this.mockExtensionsManager.stage1(Extension4);
      }
    }

    @injectable()
    class Extension1 implements Extension {
      async stage1() {}
    }

    @injectable()
    class Extension2 implements Extension {
      constructor(public mockExtensionsManager: MockExtensionsManager) {}

      async stage1() {
        await this.mockExtensionsManager.stage1(Extension3);
      }
    }

    @injectable()
    class Extension4 implements Extension {
      constructor(public mockExtensionsManager: MockExtensionsManager) {}

      async stage1() {
        await this.mockExtensionsManager.stage1(Extension3);
      }
    }

    beforeEach(() => {
      const injector = Injector.resolveAndCreate([
        ...defaultProvidersPerApp,
        ...getExtensionProviderList([
          { extension: Extension1 },
          { extension: Extension2 },
          { extension: Extension3 },
          { extension: Extension4 },
        ]),
        MockExtensionsManager,
        ExtensionsContext,
        ExtensionCounters,
      ]);
      mock = injector.get(MockExtensionsManager) as MockExtensionsManager;
    });

    it('Extension1 without deps', async () => {
      await expect(mock.stage1(Extension1)).resolves.not.toThrow();
    });

    it('Extension2 has circular dependencies', async () => {
      const msg =
        'Detected circular dependencies: Extension3 -> Extension3 -> Extension4 -> Extension4 -> Extension3. It is started from Extension2 -> Extension2.';
      await expect(mock.stage1(Extension2)).rejects.toThrow(msg);
    });

    it('Extension3 has circular dependencies', async () => {
      const msg =
        'Detected circular dependencies: Extension3 -> Extension3 -> Extension4 -> Extension4 -> Extension3.';
      await expect(mock.stage1(Extension3)).rejects.toThrow(msg);
    });

    it('Extension4 has circular dependencies', async () => {
      const msg =
        'Detected circular dependencies: Extension4 -> Extension4 -> Extension3 -> Extension3 -> Extension4.';
      await expect(mock.stage1(Extension4)).rejects.toThrow(msg);
    });
  });
});
