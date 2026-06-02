import { BaseAppInitializer, ModuleManager, ModuleWithParams, skipSelf } from '@ditsmod/core';
import { controller, route, RequestContext, RestModuleParams } from '@ditsmod/rest';

import { SecondModule } from '../second.module.js';
import { ThirdModule } from '../third/third.module.js';

const secondModuleWithParams: ModuleWithParams & RestModuleParams = { path: '', module: SecondModule };
const thirdModuleWithParams: ModuleWithParams = { module: ThirdModule };

@controller()
export class FirstController {
  constructor(
    @skipSelf() private moduleManager: ModuleManager,
    @skipSelf() private appInitializer: BaseAppInitializer,
  ) {}

  @route('GET')
  tellHello(reqCtx: RequestContext) {
    reqCtx.send('first module.\n');
  }

  @route('GET', 'add-2')
  async addSecondModule(reqCtx: RequestContext) {
    this.moduleManager.addImport(secondModuleWithParams);
    await this.reinitApp(reqCtx, 'second', 'importing');
  }

  @route('GET', 'del-2')
  async removeSecondModule(reqCtx: RequestContext) {
    this.moduleManager.removeImport(secondModuleWithParams);
    await this.reinitApp(reqCtx, 'second', 'removing');
  }

  @route('GET', 'add-3')
  async addThirdModule(reqCtx: RequestContext) {
    this.moduleManager.addImport(thirdModuleWithParams);
    await this.reinitApp(reqCtx, 'third', 'importing');
  }

  @route('GET', 'del-3')
  async removeThirdModule(reqCtx: RequestContext) {
    this.moduleManager.removeImport(thirdModuleWithParams);
    await this.reinitApp(reqCtx, 'third', 'removing');
  }

  private async reinitApp(reqCtx: RequestContext, moduleName: 'second' | 'third', action: 'importing' | 'removing') {
    const err = await this.appInitializer.reinit();
    if (err) {
      reqCtx.send(`${action} ${moduleName} failed: ${err.message}\n`);
    } else {
      reqCtx.send(`${moduleName} successfully ${action}!\n`);
    }
  }
}
