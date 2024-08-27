import { jest } from '@jest/globals';
import { TestApplication } from '@ditsmod/testing';

import { InjectionToken, Router, featureModule, injectable } from '#core/index.js';
import { rootModule } from '#decorators/root-module.js';
import { Extension, ExtensionInitMeta, ExtensionManagerInitMeta } from '#types/extension-types.js';
import { ExtensionsManager } from '#services/extensions-manager.js';

describe('extensions e2e', () => {
  it('check isLastExtensionCall', async () => {
    const extensionInit = jest.fn();

    const MY_EXTENSIONS1 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS1');
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}

    /**
     * This extension is declared in `Module1`, which is imported into three different modules.
     * The tests check whether the `isLastExtensionCall` parameter is passed to the `init()` method.
     */
    @injectable()
    class Extension1 implements Extension<any> {
      private inited: boolean;

      async init(isLastExtensionCall: boolean) {
        if (this.inited) {
          return;
        }

        extensionInit(isLastExtensionCall);

        this.inited = true;
      }
    }

    @featureModule({
      providersPerMod: [Provider1],
      extensions: [{ groupToken: MY_EXTENSIONS1, extension: Extension1, exportedOnly: true }],
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

    const MY_EXTENSIONS1 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS1');
    const MY_EXTENSIONS2 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS2');
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}

    /**
     * This extension is declared in `Module1`, which is imported into three different modules.
     * A second extension that depends on this extension is declared below. The second extension
     * is declared in `Module2`, it is imported into two different modules. The tests check exactly
     * what the `ExtensionsManager` returns from the `MY_EXTENSIONS1` group, and how many times
     * the initialization of the second extension is called.
     */
    @injectable()
    class Extension1 implements Extension<string> {
      data: any;

      async init(isLastExtensionCall: boolean) {
        if (this.data) {
          return this.data;
        }

        extensionInit1(isLastExtensionCall);
        this.data = extensionPayload;
        return this.data;
      }
    }

    @injectable()
    class Extension2 implements Extension<any> {
      private inited: boolean;

      constructor(private extensionManager: ExtensionsManager) {}

      async init() {
        if (this.inited) {
          return;
        }

        const totalInitMeta = await this.extensionManager.init(MY_EXTENSIONS1);
        extensionInit2(totalInitMeta);
        this.inited = true;
      }
    }

    @featureModule({
      providersPerMod: [Provider1],
      extensions: [{ groupToken: MY_EXTENSIONS1, extension: Extension1, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      providersPerMod: [Provider2],
      extensions: [{ groupToken: MY_EXTENSIONS2, extension: Extension2, exportedOnly: true }],
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
    const initMeta = new ExtensionInitMeta(extension, extensionPayload, true, 1);
    const extensionManagerInitMeta = new ExtensionManagerInitMeta('TextModule', [initMeta]);
    extensionManagerInitMeta.delay = true;
    extensionManagerInitMeta.countdown = 1;
    expect(extensionInit2).toHaveBeenNthCalledWith(1, extensionManagerInitMeta);
    initMeta.delay = false;
    initMeta.countdown = 0;
    extensionManagerInitMeta.delay = undefined;
    extensionManagerInitMeta.countdown = 0;
    expect(extensionInit2).toHaveBeenNthCalledWith(2, extensionManagerInitMeta);
  });

  it('extension depends on data from the entire application', async () => {
    const extensionInit1 = jest.fn();
    const extensionInit2 = jest.fn();
    const extensionPayload: string = 'Extension1 payload';

    const MY_EXTENSIONS1 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS1');
    const MY_EXTENSIONS2 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS2');
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

      async init(isLastExtensionCall: boolean) {
        if (this.data) {
          return this.data;
        }

        extensionInit1(isLastExtensionCall);
        this.data = extensionPayload;
        return this.data;
      }
    }

    @injectable()
    class Extension2 implements Extension<any> {
      private inited: boolean;

      constructor(private extensionManager: ExtensionsManager) {}

      async init() {
        if (this.inited) {
          return;
        }

        const totalInitMeta = await this.extensionManager.init(MY_EXTENSIONS1);
        extensionInit2(totalInitMeta);
        if (totalInitMeta.delay) {
          return;
        }

        totalInitMeta.groupInitMeta.map((initMeta) => initMeta.payload);

        this.inited = true;
        return;
      }
    }

    @featureModule({
      extensions: [{ groupToken: MY_EXTENSIONS1, extension: Extension1, exportedOnly: true }],
    })
    class Module1 {}

    @featureModule({
      imports: [Module1],
      extensions: [{ groupToken: MY_EXTENSIONS2, extension: Extension2, exportedOnly: true }],
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
    const extension = new Extension1();
    extension.data = extensionPayload;
    const initMeta = new ExtensionInitMeta(extension, extensionPayload, true, 1);
    const extensionManagerInitMeta = new ExtensionManagerInitMeta('TextModule', [initMeta]);
    extensionManagerInitMeta.delay = true;
    extensionManagerInitMeta.countdown = 1;
    expect(extensionInit2).toHaveBeenNthCalledWith(1, extensionManagerInitMeta);
    initMeta.delay = false;
    initMeta.countdown = 0;
    extensionManagerInitMeta.delay = undefined;
    extensionManagerInitMeta.countdown = 0;
    expect(extensionInit2).toHaveBeenNthCalledWith(2, extensionManagerInitMeta);
  });
});
