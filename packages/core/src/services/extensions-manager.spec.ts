import { EXTENSIONS_COUNTERS } from '#constans';
import { injectable, InjectionToken, Injector } from '#di';
import { Extension } from '#types/mix.js';
import { defaultProvidersPerApp } from './default-providers-per-app.js';
import { ExtensionsContext } from './extensions-context.js';
import { ExtensionsManager } from './extensions-manager.js';

describe('ExtensionsManager circular dependencies', () => {
  class MockExtensionsManager extends ExtensionsManager {
    override unfinishedInit = new Set<Extension<any>>();
  }

  let mock: MockExtensionsManager;
  const MY_EXTENSIONS1 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS1');
  const MY_EXTENSIONS2 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS2');
  const MY_EXTENSIONS3 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS3');
  const MY_EXTENSIONS4 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS4');

  @injectable()
  class Extension1 implements Extension<any> {
    private inited: boolean;

    async init() {
      if (this.inited) {
        return;
      }
      this.inited = true;
    }
  }

  @injectable()
  class Extension2 implements Extension<any> {
    private inited: boolean;

    constructor(public mockExtensionsManager: MockExtensionsManager) {}

    async init() {
      if (this.inited) {
        return;
      }
      await this.mockExtensionsManager.init(MY_EXTENSIONS3);
      this.inited = true;
    }
  }

  @injectable()
  class Extension3 implements Extension<any> {
    private inited: boolean;

    constructor(public mockExtensionsManager: MockExtensionsManager) {}

    async init() {
      if (this.inited) {
        return;
      }
      await this.mockExtensionsManager.init(MY_EXTENSIONS4);
      this.inited = true;
    }
  }
  @injectable()
  class Extension4 implements Extension<any> {
    private inited: boolean;

    constructor(public mockExtensionsManager: MockExtensionsManager) {}

    async init() {
      if (this.inited) {
        return;
      }
      await this.mockExtensionsManager.init(MY_EXTENSIONS3);
      this.inited = true;
    }
  }

  beforeEach(() => {
    const injector = Injector.resolveAndCreate([
      ...defaultProvidersPerApp,
      MockExtensionsManager,
      ExtensionsContext,
      { token: MY_EXTENSIONS1, useClass: Extension1, multi: true },
      { token: MY_EXTENSIONS2, useClass: Extension2, multi: true },
      { token: MY_EXTENSIONS3, useClass: Extension3, multi: true },
      { token: MY_EXTENSIONS4, useClass: Extension4, multi: true },
      { token: EXTENSIONS_COUNTERS, useValue: new Map() },
    ]);
    mock = injector.get(MockExtensionsManager) as MockExtensionsManager;
  });

  it('MY_EXTENSIONS1 without deps', async () => {
    await expect(mock.init(MY_EXTENSIONS1)).resolves.not.toThrow();
  });

  it('MY_EXTENSIONS2 has circular dependencies', async () => {
    const msg =
      'Detected circular dependencies: MY_EXTENSIONS3 -> Extension3 -> MY_EXTENSIONS4 -> Extension4 -> MY_EXTENSIONS3. It is started from MY_EXTENSIONS2 -> Extension2.';
    await expect(mock.init(MY_EXTENSIONS2)).rejects.toThrow(msg);
  });

  it('MY_EXTENSIONS3 has circular dependencies', async () => {
    const msg =
      'Detected circular dependencies: MY_EXTENSIONS3 -> Extension3 -> MY_EXTENSIONS4 -> Extension4 -> MY_EXTENSIONS3.';
    await expect(mock.init(MY_EXTENSIONS3)).rejects.toThrow(msg);
  });

  it('MY_EXTENSIONS4 has circular dependencies', async () => {
    const msg =
      'Detected circular dependencies: MY_EXTENSIONS4 -> Extension4 -> MY_EXTENSIONS3 -> Extension3 -> MY_EXTENSIONS4.';
    await expect(mock.init(MY_EXTENSIONS4)).rejects.toThrow(msg);
  });
});
