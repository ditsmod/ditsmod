import { Extension, ExtensionCounters } from '#extension/extension-types.js';
import { getExtensionProviderList } from '#extension/extension-providers-and-configs.js';
import { defaultProvidersPerApp } from '#init/default-providers-per-app.js';
import { ExtensionContext } from '#extension/extensions-context.js';
import { StageIteration, ExtensionManager } from '#extension/extension-manager.js';
import { CircularDepsBetweenExtensions } from '#error/core-errors.js';
import { NormalizedModuleMeta } from '#init/base-meta.js';
import { injectable } from '#di/decorators.js';
import { Injector } from '#di/injector.js';

describe('ExtensionManager', () => {
  describe('stage1', () => {});

  describe('circular dependencies', () => {
    class MockExtensionManager extends ExtensionManager {
      override normalizedModuleMeta = new NormalizedModuleMeta();
      override stageIterationMap = new Map();
      override currStageIteration = new StageIteration(0);
    }

    let mock: MockExtensionManager;

    @injectable()
    class Extension3 implements Extension {
      constructor(public mockExtensionManager: MockExtensionManager) {}

      async stage1() {
        await this.mockExtensionManager.stage1(Extension4);
      }
    }

    @injectable()
    class Extension1 implements Extension {
      async stage1() {}
    }

    @injectable()
    class Extension2 implements Extension {
      constructor(public mockExtensionManager: MockExtensionManager) {}

      async stage1() {
        await this.mockExtensionManager.stage1(Extension3);
      }
    }

    @injectable()
    class Extension4 implements Extension {
      constructor(public mockExtensionManager: MockExtensionManager) {}

      async stage1() {
        await this.mockExtensionManager.stage1(Extension3);
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
        MockExtensionManager,
        ExtensionContext,
        ExtensionCounters,
      ]);
      mock = injector.get(MockExtensionManager) as MockExtensionManager;
    });

    it('Extension1 without deps', async () => {
      await expect(mock.stage1(Extension1)).resolves.not.toThrow();
    });

    it('Extension2 has circular dependencies', async () => {
      const err = new CircularDepsBetweenExtensions(
        '[group of Extension3] -> Extension3 -> [group of Extension4] -> Extension4 -> [group of Extension3]',
        '[group of Extension2] -> Extension2',
      );
      await expect(mock.stage1(Extension2)).rejects.toThrow(err);
    });

    it('Extension3 has circular dependencies', async () => {
      const err = new CircularDepsBetweenExtensions(
        '[group of Extension3] -> Extension3 -> [group of Extension4] -> Extension4 -> [group of Extension3]',
      );
      await expect(mock.stage1(Extension3)).rejects.toThrow(err);
    });

    it('Extension4 has circular dependencies', async () => {
      const err = new CircularDepsBetweenExtensions(
        '[group of Extension4] -> Extension4 -> [group of Extension3] -> Extension3 -> [group of Extension4]',
      );
      await expect(mock.stage1(Extension4)).rejects.toThrow(err);
    });
  });
});
