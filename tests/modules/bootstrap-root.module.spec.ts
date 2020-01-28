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

    extractModuleMetadata(appModule: ModuleType): RootModuleDecorator {
      return super.extractModuleMetadata(appModule);
    }
  }

  const mockBs = new MockBootstrapRootModule();

  @RootModule({ controllers: [] })
  class ClassWithDecorators {}

  class ClassWithoutDecorators {}

  describe('extractModuleMetadata()', () => {
    it('should extract metatada from ClassWithDecorators', () => {
      expect(mockBs.extractModuleMetadata(ClassWithDecorators)).toEqual(new RootModule({ controllers: [] }));
    });

    it('ClassWithoutDecorators should not have metatada', () => {
      const msg = `Module build failed: module "ClassWithoutDecorators" does not have the "@RootModule()" decorator`;
      expect(() => mockBs.extractModuleMetadata(ClassWithoutDecorators)).toThrowError(msg);
    });
  });
});
