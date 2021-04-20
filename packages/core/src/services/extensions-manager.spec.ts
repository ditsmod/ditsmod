import 'reflect-metadata';
import { Injectable, InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { Extension } from '../types/mix';
import { defaultProvidersPerApp } from './default-providers-per-app';
import { ExtensionsManager } from './extensions-manager';

describe('ExtensionsManager cyclic dependencies', () => {
  class MockExtensionsManager extends ExtensionsManager {
    unfinishedInitExtensions = new Set<Extension<any>>();
  }

  let mock: MockExtensionsManager;
  const MY_EXTENSIONS1 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS1');
  const MY_EXTENSIONS2 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS2');
  const MY_EXTENSIONS3 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS3');
  const MY_EXTENSIONS4 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS4');

  @Injectable()
  class Extension1 implements Extension<any> {
    private inited: boolean;

    async init() {
      if (this.inited) {
        return;
      }

      this.inited = true;
    }
  }

  @Injectable()
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

  @Injectable()
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
  @Injectable()
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
    const injector = ReflectiveInjector.resolveAndCreate([
      ...defaultProvidersPerApp,
      MockExtensionsManager,
      { provide: MY_EXTENSIONS1, useClass: Extension1, multi: true },
      { provide: MY_EXTENSIONS2, useClass: Extension2, multi: true },
      { provide: MY_EXTENSIONS3, useClass: Extension3, multi: true },
      { provide: MY_EXTENSIONS4, useClass: Extension4, multi: true },
    ]);
    mock = injector.get(MockExtensionsManager) as MockExtensionsManager;
  });

  it('MY_EXTENSIONS1 without deps', async () => {
    await expect(mock.init(MY_EXTENSIONS1)).resolves.not.toThrow();
  });

  it('MY_EXTENSIONS2 has cyclic dependencies', async () => {
    const msg = 'Detected cyclic dependencies: Extension3 -> Extension4 -> Extension3. It is started from Extension2';
    await expect(mock.init(MY_EXTENSIONS2)).rejects.toThrowError(msg);
  });

  it('MY_EXTENSIONS3 has cyclic dependencies', async () => {
    const msg = 'Detected cyclic dependencies: Extension3 -> Extension4 -> Extension3.';
    await expect(mock.init(MY_EXTENSIONS3)).rejects.toThrowError(msg);
  });

  it('MY_EXTENSIONS4 has cyclic dependencies', async () => {
    const msg = 'Detected cyclic dependencies: Extension4 -> Extension3 -> Extension4.';
    await expect(mock.init(MY_EXTENSIONS4)).rejects.toThrowError(msg);
  });
});
