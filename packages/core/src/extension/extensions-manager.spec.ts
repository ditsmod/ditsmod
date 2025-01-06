import { describe, expect, it, beforeEach } from 'vitest';

import { injectable, InjectionToken, Injector } from '#di';
import { Extension, ExtensionCounters } from '#extension/extension-types.js';
import { getExtensionProviderList } from '#extension/get-extension-provider.js';
import { defaultProvidersPerApp } from '#init/default-providers-per-app.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { StageIteration, ExtensionsManager } from '#extension/extensions-manager.js';

describe('ExtensionsManager', () => {
  describe('stage1', () => {});

  describe('circular dependencies', () => {
    class MockExtensionsManager extends ExtensionsManager {
      override unfinishedInit = new Set<Extension>();
      override stageIterationMap = new Map();
      override currStageIteration = new StageIteration;
    }

    let mock: MockExtensionsManager;
    const MY_EXTENSIONS1 = new InjectionToken<Extension[]>('MY_EXTENSIONS1');
    const MY_EXTENSIONS2 = new InjectionToken<Extension[]>('MY_EXTENSIONS2');
    const MY_EXTENSIONS3 = new InjectionToken<Extension[]>('MY_EXTENSIONS3');
    const MY_EXTENSIONS4 = new InjectionToken<Extension[]>('MY_EXTENSIONS4');

    @injectable()
    class Extension1 implements Extension {
      async stage1() {}
    }

    @injectable()
    class Extension2 implements Extension {
      constructor(public mockExtensionsManager: MockExtensionsManager) {}

      async stage1() {
        await this.mockExtensionsManager.stage1(MY_EXTENSIONS3);
      }
    }

    @injectable()
    class Extension3 implements Extension {
      constructor(public mockExtensionsManager: MockExtensionsManager) {}

      async stage1() {
        await this.mockExtensionsManager.stage1(MY_EXTENSIONS4);
      }
    }

    @injectable()
    class Extension4 implements Extension {
      constructor(public mockExtensionsManager: MockExtensionsManager) {}

      async stage1() {
        await this.mockExtensionsManager.stage1(MY_EXTENSIONS3);
      }
    }

    beforeEach(() => {
      const injector = Injector.resolveAndCreate([
        ...defaultProvidersPerApp,
        ...getExtensionProviderList([
          { group: MY_EXTENSIONS1, extension: Extension1 },
          { group: MY_EXTENSIONS2, extension: Extension2 },
          { group: MY_EXTENSIONS3, extension: Extension3 },
          { group: MY_EXTENSIONS4, extension: Extension4 },
        ]),
        MockExtensionsManager,
        ExtensionsContext,
        ExtensionCounters,
      ]);
      mock = injector.get(MockExtensionsManager) as MockExtensionsManager;
    });

    it('MY_EXTENSIONS1 without deps', async () => {
      await expect(mock.stage1(MY_EXTENSIONS1)).resolves.not.toThrow();
    });

    it('MY_EXTENSIONS2 has circular dependencies', async () => {
      const msg =
        'Detected circular dependencies: MY_EXTENSIONS3 -> Extension3 -> MY_EXTENSIONS4 -> Extension4 -> MY_EXTENSIONS3. It is started from MY_EXTENSIONS2 -> Extension2.';
      await expect(mock.stage1(MY_EXTENSIONS2)).rejects.toThrow(msg);
    });

    it('MY_EXTENSIONS3 has circular dependencies', async () => {
      const msg =
        'Detected circular dependencies: MY_EXTENSIONS3 -> Extension3 -> MY_EXTENSIONS4 -> Extension4 -> MY_EXTENSIONS3.';
      await expect(mock.stage1(MY_EXTENSIONS3)).rejects.toThrow(msg);
    });

    it('MY_EXTENSIONS4 has circular dependencies', async () => {
      const msg =
        'Detected circular dependencies: MY_EXTENSIONS4 -> Extension4 -> MY_EXTENSIONS3 -> Extension3 -> MY_EXTENSIONS4.';
      await expect(mock.stage1(MY_EXTENSIONS4)).rejects.toThrow(msg);
    });
  });
});
