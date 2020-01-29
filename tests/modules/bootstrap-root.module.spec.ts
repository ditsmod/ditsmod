import { ListenOptions } from 'net';
import { Provider, ReflectiveInjector } from 'ts-di';

import { BootstrapRootModule } from '../../src/modules/bootstrap-root.module';
import { ModuleType, Logger, HttpModule, ServerOptions, Server, Router } from '../../src/types/types';
import { RootModuleDecorator, RootModule } from '../../src/types/decorators';
import { PreRequest } from '../../src/services/pre-request.service';

fdescribe('BootstrapRootModule', () => {
  class MockBootstrapRootModule extends BootstrapRootModule {
    log: Logger;
    serverName: string;
    httpModule: HttpModule;
    serverOptions: ServerOptions;
    server: Server;
    listenOptions: ListenOptions;
    providersPerApp: Provider[];
    injectorPerApp: ReflectiveInjector;
    router: Router;
    preReq: PreRequest;

    mergeMetadata(appModule: ModuleType): RootModuleDecorator {
      return super.mergeMetadata(appModule);
    }
  }

  const mockBs = new MockBootstrapRootModule();

  class SomeControllerClass {}
  @RootModule({ controllers: [SomeControllerClass] })
  class ClassWithDecorators {}

  class ClassWithoutDecorators {}

  describe('mergeMetadata()', () => {
    it('should merge default metatada with ClassWithDecorators metadata', () => {
      const metadata = mockBs.mergeMetadata(ClassWithDecorators);
      expect(metadata.serverName).toEqual('restify-ts');
      expect(metadata.serverOptions).toEqual({});
      expect(metadata.httpModule).toBeDefined();
      expect(metadata.providersPerApp && metadata.providersPerApp.length).toBe(5);
      expect(metadata.controllers).toEqual(undefined);
      expect(metadata.exports).toEqual(undefined);
      expect(metadata.imports).toEqual(undefined);
      expect(metadata.listenOptions).toBeDefined();
      expect(metadata.providersPerMod).toEqual(undefined);
      expect(metadata.providersPerReq).toEqual(undefined);
    });

    it('ClassWithoutDecorators should not have metatada', () => {
      const msg = `Module build failed: module "ClassWithoutDecorators" does not have the "@RootModule()" decorator`;
      expect(() => mockBs.mergeMetadata(ClassWithoutDecorators)).toThrowError(msg);
    });
  });
});
