import { jest } from '@jest/globals';
import { TestApplication } from '@ditsmod/testing';

import { InjectionToken, injectable } from '#di';
import { rootModule } from '#decorators/root-module.js';
import { Extension, DebugStage1Meta, GroupStage1Meta, GroupStage1Meta2 } from '#extension/extension-types.js';
import { ExtensionsManager } from '#extension/extensions-manager.js';
import { featureModule } from '#decorators/module.js';
import { Router } from '#types/router.js';

describe('extensions e2e', () => {
  it('check isLastModule', async () => {
    const extensionInit = jest.fn();

    const MY_EXTENSIONS1 = new InjectionToken<Extension[]>('MY_EXTENSIONS1');
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
      extensions: [{ token: MY_EXTENSIONS1, extension: Extension1, exportedOnly: true }],
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
    const extensionInit1 = jest.fn();
    const extensionInit2 = jest.fn();

    const MY_EXTENSIONS1 = new InjectionToken<Extension[]>('MY_EXTENSIONS1');
    const MY_EXTENSIONS2 = new InjectionToken<Extension[]>('MY_EXTENSIONS2');
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
        const groupStage1Meta = await this.extensionManager.stage1(MY_EXTENSIONS1);
        extensionInit2(groupStage1Meta);
      }
    }

    @featureModule({
      providersPerMod: [Provider1],
      extensions: [{ token: MY_EXTENSIONS1, extension: Extension1, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider2],
      extensions: [{ token: MY_EXTENSIONS2, extension: Extension2, exportedOnly: true }],
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
    const stage1Meta = new DebugStage1Meta(extension, undefined, true, 1);
    const groupStage1Meta = new GroupStage1Meta('Module3', [stage1Meta], [undefined]);
    groupStage1Meta.delay = true;
    groupStage1Meta.countdown = 1;
    groupStage1Meta.groupDataPerApp = expect.any(Array);
    expect(extensionInit2).toHaveBeenNthCalledWith(1, groupStage1Meta);
    stage1Meta.delay = false;
    stage1Meta.countdown = 0;
    groupStage1Meta.delay = false;
    groupStage1Meta.countdown = 0;
    groupStage1Meta.moduleName = 'AppModule';
    expect(extensionInit2).toHaveBeenNthCalledWith(2, groupStage1Meta);
  });

  it('extension depends on data from the entire application', async () => {
    const spyIsLastModule = jest.fn();
    const spyMetaFromAllModules = jest.fn();
    const spyMetaFromCurrentModule = jest.fn();

    const MY_EXTENSIONS1 = new InjectionToken<Extension[]>('MY_EXTENSIONS1');
    const MY_EXTENSIONS2 = new InjectionToken<Extension[]>('MY_EXTENSIONS2');
    class Provider1 {}

    /**
     * This extension is declared in `Module1`, which is imported into three different modules.
     * A second extension that depends on this extension is declared below. The second extension
     * is declared in `Module2`, it is imported into one module. The tests check exactly
     * what the `ExtensionsManager` returns from the `MY_EXTENSIONS1` group, and how many times
     * the initialization of the second extension is called.
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
        const groupStage1Meta = await this.extensionManager.stage1(MY_EXTENSIONS1, true);
        spyMetaFromAllModules(structuredClone(groupStage1Meta));
      }
    }

    @injectable()
    class Extension3 implements Extension {
      constructor(private extensionManager: ExtensionsManager) {}

      async stage1() {
        const groupStage1Meta = await this.extensionManager.stage1(MY_EXTENSIONS1);
        spyMetaFromCurrentModule(structuredClone(groupStage1Meta));
      }
    }

    @featureModule({
      extensions: [{ token: MY_EXTENSIONS1, extension: Extension1, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      extensions: [{ token: MY_EXTENSIONS2, extension: Extension2, exportedOnly: true }],
    })
    class Module2 {}

    @featureModule({
      extensions: [{ token: MY_EXTENSIONS2, extension: Extension3, exportedOnly: true }],
    })
    class Module4 {}

    @featureModule({
      imports: [Module1, Module2],
      providersPerMod: [Provider1],
      exports: [Provider1],
    })
    class Module3 {}

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
    } as GroupStage1Meta;

    expect(spyMetaFromAllModules).toHaveBeenCalledTimes(2);
    const firstCall = structuredClone(fullMeta);
    firstCall.moduleName = 'Module3';
    firstCall.delay = true;
    firstCall.countdown = 1;
    firstCall.groupDebugMeta.at(0)!.delay = true;
    firstCall.groupDebugMeta.at(0)!.countdown = 1;
    firstCall.groupDataPerApp.pop();
    expect(spyMetaFromAllModules).toHaveBeenNthCalledWith(1, firstCall);

    const secondCall = structuredClone(fullMeta) as GroupStage1Meta2;
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
