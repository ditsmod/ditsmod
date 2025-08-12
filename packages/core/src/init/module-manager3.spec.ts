import { featureModule } from '#decorators/feature-module.js';
import { rootModule } from '#decorators/root-module.js';
import { forwardRef } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleManager } from '#init/module-manager.js';
import { Module1 } from '#init/module-manager4.spec.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';

@featureModule({ imports: [forwardRef(() => Module1)], providersPerApp: [{ token: 'token2' }] })
class Module2 {}

@featureModule({ imports: [Module2], providersPerApp: [{ token: 'token3' }] })
export class Module3 {}

describe('ModuleManager', () => {
  let mock: ModuleManager;

  beforeEach(() => {
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName' });
    const systemErrMediator = new SystemErrorMediator({ moduleName: 'fakeName' });
    mock = new ModuleManager(systemLogMediator, systemErrMediator);
  });

  it('circular imports modules with forwardRef()', () => {
    @featureModule({ imports: [Module3], providersPerApp: [{ token: 'token4' }] })
    class Module4 {}

    @rootModule({
      imports: [Module4],
    })
    class AppModule {}
    expect(() => mock.scanRootModule(AppModule)).not.toThrow();
  });
});
