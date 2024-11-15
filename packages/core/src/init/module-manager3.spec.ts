import { controller } from '#decorators/controller.js';
import { featureModule } from '#decorators/module.js';
import { rootModule } from '#decorators/root-module.js';
import { forwardRef } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleManager } from '#init/module-manager.js';
import { Module1 } from '#init/module-manager4.spec.js';

@controller()
class Controller1 {}

@featureModule({ imports: [forwardRef(() => Module1)], controllers: [Controller1] })
class Module2 {}

@featureModule({ imports: [Module2], controllers: [Controller1] })
export class Module3 {}

describe('ModuleManager', () => {
  let mock: ModuleManager;

  beforeEach(() => {
    const systemLogMediator = new SystemLogMediator({ moduleName: 'fakeName', path: '' });
    mock = new ModuleManager(systemLogMediator);
  });

  it('circular imports modules with forwardRef()', () => {
    @featureModule({ imports: [Module3], controllers: [Controller1] })
    class Module4 {}

    @rootModule({
      imports: [Module4],
    })
    class AppModule {}
    expect(() => mock.scanRootModule(AppModule)).not.toThrow();
  });
});
