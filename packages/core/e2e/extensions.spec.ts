import { jest } from '@jest/globals';
import { TestApplication } from '@ditsmod/testing';

import { InjectionToken, injectable } from '#di';
import { rootModule } from '#decorators/root-module.js';
import { Extension, DebugStage1Meta, GroupStage1Meta } from '#types/extension-types.js';
import { ExtensionsManager } from '#services/extensions-manager.js';
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

    await new TestApplication(AppModule).getServer();
    expect(extensionInit).toHaveBeenCalledTimes(3);
    expect(extensionInit).toHaveBeenNthCalledWith(1, false);
    expect(extensionInit).toHaveBeenNthCalledWith(2, false);
    expect(extensionInit).toHaveBeenNthCalledWith(3, true);
  });

  it('one extension depends on another', async () => {
    const extensionInit1 = jest.fn();
    const extensionInit2 = jest.fn();
    const extensionPayload: string = 'Extension1 payload';

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
    class Extension1 implements Extension<string> {
      data: any;

      async stage1(isLastModule: boolean) {
        if (this.data) {
          return this.data;
        }

        extensionInit1(isLastModule);
        this.data = extensionPayload;
        return this.data;
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

    await new TestApplication(AppModule).getServer();
    expect(extensionInit1).toHaveBeenCalledTimes(3);
    expect(extensionInit1).toHaveBeenNthCalledWith(1, false);
    expect(extensionInit1).toHaveBeenNthCalledWith(2, false);
    expect(extensionInit1).toHaveBeenNthCalledWith(3, true);

    expect(extensionInit2).toHaveBeenCalledTimes(2);
    const extension = new Extension1();
    extension.data = extensionPayload;
    const stage1Meta = new DebugStage1Meta(extension, extensionPayload, true, 1);
    const groupStage1Meta = new GroupStage1Meta('Module3', [stage1Meta], [extensionPayload]);
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
    const extensionInit1 = jest.fn();
    const extensionInit2 = jest.fn();
    const extensionPayload: string = 'Extension1 payload';

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
    class Extension1 implements Extension<string> {
      data: any;

      async stage1(isLastModule: boolean) {
        if (this.data) {
          return this.data;
        }

        extensionInit1(isLastModule);
        this.data = extensionPayload;
        return this.data;
      }
    }

    @injectable()
    class Extension2 implements Extension {
      constructor(private extensionManager: ExtensionsManager) {}

      async stage1() {
        const groupStage1Meta = await this.extensionManager.stage1(MY_EXTENSIONS1, true);
        extensionInit2(structuredClone(groupStage1Meta));
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
      imports: [Module1, Module2],
      providersPerMod: [Provider1],
      exports: [Provider1],
    })
    class Module3 {}

    @rootModule({
      imports: [Module1, Module3],
      providersPerApp: [{ token: Router, useValue: 'fake value' }],
    })
    class AppModule {}

    await new TestApplication(AppModule).getServer();
    expect(extensionInit1).toHaveBeenCalledTimes(3);
    expect(extensionInit1).toHaveBeenNthCalledWith(1, false);
    expect(extensionInit1).toHaveBeenNthCalledWith(2, false);
    expect(extensionInit1).toHaveBeenNthCalledWith(3, true);

    expect(extensionInit2).toHaveBeenCalledTimes(2);
    const expect1 = {
      moduleName: 'Module3',
      groupDebugMeta: [
        {
          extension: { data: 'Extension1 payload' } as any,
          payload: 'Extension1 payload',
          delay: true,
          countdown: 1,
        },
      ],
      groupData: ['Extension1 payload'],
      delay: true,
      countdown: 1,
      groupDataPerApp: [
        {
          moduleName: 'Module2',
          groupDebugMeta: [
            {
              extension: { data: 'Extension1 payload' } as any,
              payload: 'Extension1 payload',
              delay: true,
              countdown: 2,
            },
          ],
          groupData: ['Extension1 payload'],
          delay: true,
          countdown: 2,
        },
        {
          moduleName: 'Module3',
          groupDebugMeta: [
            {
              extension: { data: 'Extension1 payload' } as any,
              payload: 'Extension1 payload',
              delay: true,
              countdown: 1,
            },
          ],
          groupData: ['Extension1 payload'],
          delay: true,
          countdown: 1,
        },
      ],
    } as GroupStage1Meta;
    expect(extensionInit2).toHaveBeenNthCalledWith(1, expect1);
    const expect2 = {
      delay: false,
      groupDataPerApp: [
        {
          moduleName: 'Module2',
          groupDebugMeta: [
            {
              extension: { data: 'Extension1 payload' } as any,
              payload: 'Extension1 payload',
              delay: true,
              countdown: 2,
            },
          ],
          groupData: ['Extension1 payload'],
          delay: true,
          countdown: 2,
        },
        {
          moduleName: 'Module3',
          groupDebugMeta: [
            {
              extension: { data: 'Extension1 payload' } as any,
              payload: 'Extension1 payload',
              delay: true,
              countdown: 1,
            },
          ],
          groupData: ['Extension1 payload'],
          delay: true,
          countdown: 1,
        },
        {
          moduleName: 'AppModule',
          groupDebugMeta: [
            {
              extension: { data: 'Extension1 payload' } as any,
              payload: 'Extension1 payload',
              delay: false,
              countdown: 0,
            },
          ],
          groupData: ['Extension1 payload'],
          delay: false,
          countdown: 0,
        },
      ],
    } as GroupStage1Meta;
    expect(extensionInit2).toHaveBeenNthCalledWith(2, expect2);
  });
});
