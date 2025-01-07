import { describe, expect, it, vi } from 'vitest';
import { TestApplication } from '@ditsmod/testing';

import { InjectionToken, injectable } from '#di';
import { rootModule } from '#decorators/root-module.js';
import { Extension, Stage1DebugMeta, Stage1GroupMeta, Stage1GroupMeta2 } from '#extension/extension-types.js';
import { ExtensionsManager } from '#extension/extensions-manager.js';
import { featureModule } from '#decorators/module.js';
import { Router } from '#types/router.js';

describe('extensions e2e', () => {
  const MY_EXTENSIONS1 = new InjectionToken<Extension[]>('MY_EXTENSIONS1');
  const MY_EXTENSIONS2 = new InjectionToken<Extension[]>('MY_EXTENSIONS2');
  const MY_EXTENSIONS3 = new InjectionToken<Extension[]>('MY_EXTENSIONS3');

  it('using "before" groups, run first the group that was declared (or imported) last', async () => {
    const callOrder: string[] = [];

    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {
        callOrder.push('Extension1');
      }
    }
    @injectable()
    class Extension2 implements Extension<void> {
      async stage1() {
        callOrder.push('Extension2');
      }
    }
    @injectable()
    class Extension3 implements Extension<void> {
      async stage1() {
        callOrder.push('Extension3');
      }
    }

    @rootModule({
      providersPerApp: [{ token: Router, useValue: 'fake value' }],
      extensions: [
        { extension: Extension1, group: MY_EXTENSIONS1 },
        { extension: Extension2, group: MY_EXTENSIONS2, beforeGroup: MY_EXTENSIONS1 },
        { extension: Extension3, group: MY_EXTENSIONS3, beforeGroup: MY_EXTENSIONS2 },
      ],
    })
    class AppModule {}

    await expect(TestApplication.createTestApp(AppModule).getServer()).resolves.not.toThrow();
    expect(callOrder).toEqual(['Extension3', 'Extension2', 'Extension1']);
  });

  it('circular dependencies of groups in single module', async () => {
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {}
    }

    @rootModule({
      providersPerApp: [{ token: Router, useValue: 'fake value' }],
      extensions: [
        { extension: Extension1, group: MY_EXTENSIONS3, beforeGroup: MY_EXTENSIONS2 },
        { extension: Extension1, group: MY_EXTENSIONS2, beforeGroup: MY_EXTENSIONS1 },
        { extension: Extension1, group: MY_EXTENSIONS1, beforeGroup: MY_EXTENSIONS3 },
      ],
    })
    class AppModule {}

    const msg = ': MY_EXTENSIONS3 -> MY_EXTENSIONS2 -> MY_EXTENSIONS1 -> MY_EXTENSIONS3';
    await expect(TestApplication.createTestApp(AppModule).getServer()).rejects.toThrow(msg);
  });

  it('circular dependencies of groups in three modules', async () => {
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {}
    }

    @featureModule({
      extensions: [{ extension: Extension1, group: MY_EXTENSIONS3, beforeGroup: MY_EXTENSIONS2, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      extensions: [{ extension: Extension1, group: MY_EXTENSIONS2, beforeGroup: MY_EXTENSIONS1, exportedOnly: true }],
    })
    class Module2 {}

    @rootModule({
      imports: [Module1, Module2],
      providersPerApp: [{ token: Router, useValue: 'fake value' }],
      extensions: [{ extension: Extension1, group: MY_EXTENSIONS1, beforeGroup: MY_EXTENSIONS3 }],
    })
    class AppModule {}

    const msg = ': MY_EXTENSIONS1 -> MY_EXTENSIONS3 -> MY_EXTENSIONS2 -> MY_EXTENSIONS1';
    await expect(TestApplication.createTestApp(AppModule).getServer()).rejects.toThrow(msg);
  });

  it('circular dependencies of groups in two modules', async () => {
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {}
    }

    @featureModule({
      extensions: [{ extension: Extension1, group: MY_EXTENSIONS3, beforeGroup: MY_EXTENSIONS2, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      extensions: [
        { extension: Extension1, group: MY_EXTENSIONS2, beforeGroup: MY_EXTENSIONS1 },
        { extension: Extension1, group: MY_EXTENSIONS1, beforeGroup: MY_EXTENSIONS3 },
      ],
    })
    class Module2 {}

    @rootModule({
      imports: [Module2],
      providersPerApp: [{ token: Router, useValue: 'fake value' }],
    })
    class AppModule {}

    const msg = ': MY_EXTENSIONS2 -> MY_EXTENSIONS1 -> MY_EXTENSIONS3 -> MY_EXTENSIONS2';
    await expect(TestApplication.createTestApp(AppModule).getServer()).rejects.toThrow(msg);
  });

  it('circular dependencies of groups in Module2 with global Module1', async () => {
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1() {}
    }

    @featureModule({
      extensions: [{ extension: Extension1, group: MY_EXTENSIONS3, beforeGroup: MY_EXTENSIONS2, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      extensions: [
        { extension: Extension1, group: MY_EXTENSIONS2, beforeGroup: MY_EXTENSIONS1 },
        { extension: Extension1, group: MY_EXTENSIONS1, beforeGroup: MY_EXTENSIONS3 },
      ],
    })
    class Module2 {}

    @rootModule({
      imports: [Module1, Module2],
      providersPerApp: [{ token: Router, useValue: 'fake value' }],
      exports: [Module1],
    })
    class AppModule {}

    const msg = ': MY_EXTENSIONS2 -> MY_EXTENSIONS1 -> MY_EXTENSIONS3 -> MY_EXTENSIONS2';
    await expect(TestApplication.createTestApp(AppModule).getServer()).rejects.toThrow(msg);
  });

  it('check isLastModule', async () => {
    const extensionInit = vi.fn();
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}

    /**
     * This extension is declared in `Module1`, which is imported into three different modules.
     * The tests check whether the `isLastModule` parameter is passed to the `stage1()` method.
     */
    @injectable()
    class Extension1 implements Extension {
      async stage1(isLastModule: boolean) {
        extensionInit(isLastModule);
      }
    }

    @featureModule({
      providersPerMod: [Provider1],
      extensions: [{ group: MY_EXTENSIONS1, extension: Extension1, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider2],
      exports: [Provider2],
    })
    class Module2 {}

    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider3],
      exports: [Provider3],
    })
    class Module3 {}

    @rootModule({
      imports: [Module1, Module2, Module3],
      providersPerApp: [{ token: Router, useValue: 'fake value' }],
    })
    class AppModule {}

    await TestApplication.createTestApp(AppModule).getServer();
    expect(extensionInit).toHaveBeenCalledTimes(3);
    expect(extensionInit).toHaveBeenNthCalledWith(1, false);
    expect(extensionInit).toHaveBeenNthCalledWith(2, false);
    expect(extensionInit).toHaveBeenNthCalledWith(3, true);
  });

  it('one extension depends on another', async () => {
    const extensionInit1 = vi.fn();
    const extensionInit2 = vi.fn();
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}

    /**
     * This extension is declared in `Module1`, which is imported into three different modules.
     * A second extension that depends on this extension is declared below. The second extension
     * is declared in `Module2`, it is imported into two different modules. The tests check exactly
     * what the `extensionsManager.stage1()` returns from the `MY_EXTENSIONS1` group, and how many times
     * the initialization of the second extension is called.
     */
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1(isLastModule: boolean) {
        extensionInit1(isLastModule);
      }
    }

    @injectable()
    class Extension2 implements Extension {
      constructor(private extensionManager: ExtensionsManager) {}

      async stage1() {
        const stage1GroupMeta = await this.extensionManager.stage1(MY_EXTENSIONS1);
        extensionInit2(stage1GroupMeta);
      }
    }

    @featureModule({
      providersPerMod: [Provider1],
      extensions: [{ group: MY_EXTENSIONS1, extension: Extension1, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider2],
      extensions: [{ group: MY_EXTENSIONS2, extension: Extension2, exportedOnly: true }],
      exports: [Provider2],
    })
    class Module2 {}

    @featureModule({
      imports: [Module1, Module2],
      providersPerMod: [Provider3],
      exports: [Provider3],
    })
    class Module3 {}

    @rootModule({
      imports: [Module1, Module2, Module3],
      providersPerApp: [{ token: Router, useValue: 'fake value' }],
    })
    class AppModule {}

    await TestApplication.createTestApp(AppModule).getServer();
    expect(extensionInit1).toHaveBeenCalledTimes(3);
    expect(extensionInit1).toHaveBeenNthCalledWith(1, false);
    expect(extensionInit1).toHaveBeenNthCalledWith(2, false);
    expect(extensionInit1).toHaveBeenNthCalledWith(3, true);

    expect(extensionInit2).toHaveBeenCalledTimes(2);
    const extension = new Extension1();
    const stage1Meta = new Stage1DebugMeta(extension, undefined, true, 1);
    const stage1GroupMeta = new Stage1GroupMeta('Module3', [stage1Meta], [undefined]);
    stage1GroupMeta.delay = true;
    stage1GroupMeta.countdown = 1;
    stage1GroupMeta.groupDataPerApp = expect.any(Array);
    expect(extensionInit2).toHaveBeenNthCalledWith(1, stage1GroupMeta);
    stage1Meta.delay = false;
    stage1Meta.countdown = 0;
    stage1GroupMeta.delay = false;
    stage1GroupMeta.countdown = 0;
    stage1GroupMeta.moduleName = 'AppModule';
    expect(extensionInit2).toHaveBeenNthCalledWith(2, stage1GroupMeta);
  });

  it.only('extension depends on data from the entire application', async () => {
    const spyIsLastModule = vi.fn();
    const spyMetaFromAllModules = vi.fn();
    const spyMetaFromCurrentModule = vi.fn();
    class Provider1 {}

    /**
     * This extension is declared in `Module1`, which is imported into three different modules.
     * A second extension that depends on this extension is declared below. The second extension
     * is declared in `Module2`, it is imported into one module.
     * 
     * The test verifies that `ExtensionsManager` returns data for `MY_EXTENSIONS1` from the entire
     * application, even though `Module2` is imported into only one module.
     */
    @injectable()
    class Extension1 implements Extension<void> {
      async stage1(isLastModule: boolean) {
        spyIsLastModule(isLastModule);
      }
    }

    @injectable()
    class Extension2 implements Extension {
      constructor(private extensionManager: ExtensionsManager) {}

      async stage1() {
        const stage1GroupMeta = await this.extensionManager.stage1(MY_EXTENSIONS1, true);
        spyMetaFromAllModules(structuredClone(stage1GroupMeta));
      }
    }

    @injectable()
    class Extension3 implements Extension {
      constructor(private extensionManager: ExtensionsManager) {}

      async stage1() {
        const stage1GroupMeta = await this.extensionManager.stage1(MY_EXTENSIONS1);
        spyMetaFromCurrentModule(structuredClone(stage1GroupMeta));
      }
    }

    @featureModule({
      extensions: [{ group: MY_EXTENSIONS1, extension: Extension1, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      extensions: [{ group: MY_EXTENSIONS2, extension: Extension2, exportedOnly: true }],
    })
    class Module2 {}

    @featureModule({
      imports: [Module1, Module2],
      providersPerMod: [Provider1],
      exports: [Provider1],
    })
    class Module3 {}

    @featureModule({
      extensions: [{ group: MY_EXTENSIONS2, extension: Extension3, exportedOnly: true }],
    })
    class Module4 {}

    @rootModule({
      imports: [Module1, Module3, Module4],
      providersPerApp: [{ token: Router, useValue: 'fake value' }],
    })
    class AppModule {}

    await TestApplication.createTestApp(AppModule).getServer();
    expect(spyIsLastModule).toHaveBeenCalledTimes(3);
    expect(spyIsLastModule).toHaveBeenNthCalledWith(1, false);
    expect(spyIsLastModule).toHaveBeenNthCalledWith(2, false);
    expect(spyIsLastModule).toHaveBeenNthCalledWith(3, true);

    const fullMeta = {
      moduleName: 'AppModule',
      groupDebugMeta: [
        {
          extension: {} as any,
          payload: undefined,
          delay: false,
          countdown: 0,
        },
      ],
      groupData: [undefined],
      delay: false,
      countdown: 0,
      groupDataPerApp: [
        {
          moduleName: 'Module2',
          groupDebugMeta: [
            {
              extension: {} as any,
              payload: undefined,
              delay: true,
              countdown: 2,
            },
          ],
          groupData: [undefined],
          delay: true,
          countdown: 2,
        },
        {
          moduleName: 'Module3',
          groupDebugMeta: [
            {
              extension: {} as any,
              payload: undefined,
              delay: true,
              countdown: 1,
            },
          ],
          groupData: [undefined],
          delay: true,
          countdown: 1,
        },
        {
          moduleName: 'AppModule',
          groupDebugMeta: [
            {
              extension: {} as any,
              payload: undefined,
              delay: false,
              countdown: 0,
            },
          ],
          groupData: [undefined],
          delay: false,
          countdown: 0,
        },
      ],
    } as Stage1GroupMeta;

    expect(spyMetaFromAllModules).toHaveBeenCalledTimes(2);
    const firstCall = structuredClone(fullMeta);
    firstCall.moduleName = 'Module3';
    firstCall.delay = true;
    firstCall.countdown = 1;
    firstCall.groupDebugMeta.at(0)!.delay = true;
    firstCall.groupDebugMeta.at(0)!.countdown = 1;
    firstCall.groupDataPerApp.pop();
    expect(spyMetaFromAllModules).toHaveBeenNthCalledWith(1, firstCall);

    const secondCall = structuredClone(fullMeta) as Stage1GroupMeta2;
    secondCall.delay = false;
    delete secondCall.groupDebugMeta;
    delete secondCall.groupData;
    delete secondCall.moduleName;
    delete secondCall.countdown;
    expect(spyMetaFromAllModules).toHaveBeenNthCalledWith(2, secondCall);

    expect(spyMetaFromCurrentModule).toHaveBeenCalledTimes(1);
    expect(spyMetaFromCurrentModule).toHaveBeenNthCalledWith(1, fullMeta);
  });
});
