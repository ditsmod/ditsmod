import {
  AppInitializer,
  controller,
  ModuleManager,
  ModuleWithParams,
  RequestContext,
  route,
  skipSelf,
} from '@ditsmod/core';

import { SecondModule } from '../second/second.module';
import { ThirdModule } from '../third/third.module';

const secondModuleWithParams: ModuleWithParams = { path: '', module: SecondModule };
const thirdModuleWithParams: ModuleWithParams = { path: '', module: ThirdModule };

@controller()
export class FirstController {
  constructor(@skipSelf() private moduleManager: ModuleManager, @skipSelf() private appInitializer: AppInitializer) {}

  @route('GET')
  tellHello(ctx: RequestContext) {
    ctx.res.send('first module.\n');
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
      ctx.res.send(`${action} ${moduleName} failed: ${err.message}\n`);
    } else {
      ctx.res.send(`${moduleName} successfully ${action}!\n`);
    }
  }
}
