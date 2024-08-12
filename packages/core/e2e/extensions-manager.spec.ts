import { jest } from '@jest/globals';
import { TestApplication } from '@ditsmod/testing';

import { InjectionToken, Router, featureModule, injectable } from '#core/index.js';
import { rootModule } from '#decorators/root-module.js';
import { Extension } from '#types/extension-types.js';

describe('ExtensionsManager', () => {
  const extensionInit = jest.fn();

  const MY_EXTENSIONS1 = new InjectionToken<Extension<any>[]>('MY_EXTENSIONS1');
  class Provider1 {}
  class Provider2 {}
  class Provider3 {}

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

  it('case 1', async () => {
    await new TestApplication(AppModule).getServer();
    expect(extensionInit).toHaveBeenCalledTimes(3);
    expect(extensionInit).toHaveBeenNthCalledWith(1, false);
    expect(extensionInit).toHaveBeenNthCalledWith(2, false);
    expect(extensionInit).toHaveBeenNthCalledWith(3, true);
  });
});
