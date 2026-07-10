import { BaseAppInitializer, ModuleManager, DynamicModule, skipSelf } from '@ditsmod/core';
import { controller, route, RequestContext, RestModuleOptions } from '@ditsmod/rest';

import { SecondModule } from '../second.module.js';
import { ThirdModule } from '../third/third.module.js';

const secondModuleWithParams: DynamicModule & RestModuleOptions = { path: '', module: SecondModule };
const thirdModuleWithParams: DynamicModule = { module: ThirdModule };

@controller()
export class FirstController {
  constructor(
    @skipSelf() private moduleManager: ModuleManager,
    @skipSelf() private appInitializer: BaseAppInitializer,
  ) {}

  @route('GET')
  tellHello(ctx: RequestContext) {
    ctx.send('first module.\n');
  }

  @route('GET', 'add-2')
  async addSecondModule(ctx: RequestContext) {
    this.moduleManager.addImport(secondModuleWithParams);
    await this.reinitApp(ctx, 'second', 'importing');
  }

  @route('GET', 'del-2')
  async removeSecondModule(ctx: RequestContext) {
    this.moduleManager.removeImport(secondModuleWithParams);
    await this.reinitApp(ctx, 'second', 'removing');
  }

  @route('GET', 'add-3')
  async addThirdModule(ctx: RequestContext) {
    this.moduleManager.addImport(thirdModuleWithParams);
    await this.reinitApp(ctx, 'third', 'importing');
  }

  @route('GET', 'del-3')
  async removeThirdModule(ctx: RequestContext) {
    this.moduleManager.removeImport(thirdModuleWithParams);
    await this.reinitApp(ctx, 'third', 'removing');
  }

  private async reinitApp(ctx: RequestContext, moduleName: 'second' | 'third', action: 'importing' | 'removing') {
    const err = await this.appInitializer.reinit();
    if (err) {
      ctx.send(`${action} ${moduleName} failed: ${err.message}\n`);
    } else {
      ctx.send(`${moduleName} successfully ${action}!\n`);
    }
  }
}
