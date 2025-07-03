import { AppInitializer, ModuleManager, ModuleWithParams, skipSelf } from '@ditsmod/core';
import { controller, route, Res } from '@ditsmod/rest';

import { SecondModule } from '../second/second.module.js';
import { ThirdModule } from '../third/third.module.js';

const secondModuleWithParams: ModuleWithParams = { path: '', module: SecondModule };
const thirdModuleWithParams: ModuleWithParams = { path: '', module: ThirdModule };

@controller()
export class FirstController {
  constructor(
    @skipSelf() private moduleManager: ModuleManager,
    @skipSelf() private appInitializer: AppInitializer,
  ) {}

  @route('GET')
  tellHello(res: Res) {
    res.send('first module.\n');
  }

  @route('GET', 'add-2')
  async addSecondModule(res: Res) {
    this.moduleManager.addImport(secondModuleWithParams);
    await this.reinitApp(res, 'second', 'importing');
  }

  @route('GET', 'del-2')
  async removeSecondModule(res: Res) {
    this.moduleManager.removeImport(secondModuleWithParams);
    await this.reinitApp(res, 'second', 'removing');
  }

  @route('GET', 'add-3')
  async addThirdModule(res: Res) {
    this.moduleManager.addImport(thirdModuleWithParams);
    await this.reinitApp(res, 'third', 'importing');
  }

  @route('GET', 'del-3')
  async removeThirdModule(res: Res) {
    this.moduleManager.removeImport(thirdModuleWithParams);
    await this.reinitApp(res, 'third', 'removing');
  }

  private async reinitApp(res: Res, moduleName: 'second' | 'third', action: 'importing' | 'removing') {
    const err = await this.appInitializer.reinit();
    if (err) {
      res.send(`${action} ${moduleName} failed: ${err.message}\n`);
    } else {
      res.send(`${moduleName} successfully ${action}!\n`);
    }
  }
}
