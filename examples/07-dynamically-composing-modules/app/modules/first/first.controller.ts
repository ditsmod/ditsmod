import { AppInitializer, Controller, ModuleManager, Res, Route } from '@ditsmod/core';

import { SecondModule } from '../second/second.module';
import { ThirdModule } from '../third/third.module';

@Controller()
export class FirstController {
  constructor(
    private res: Res,
    private moduleManager: ModuleManager,
    private appInitializer: AppInitializer
  ) {}

  @Route('GET')
  tellHello() {
    this.res.send('first module.\n');
  }

  @Route('GET', 'add-2')
  async addSecondModule() {
    this.moduleManager.addImport(SecondModule);
    await this.reinitApp('second', 'importing');
  }

  @Route('GET', 'del-2')
  async removeSecondModule() {
    this.moduleManager.removeImport(SecondModule);
    await this.reinitApp('second', 'removing');
  }

  @Route('GET', 'add-3')
  async addThirdModule() {
    this.moduleManager.addImport(ThirdModule);
    await this.reinitApp('third', 'importing');
  }

  @Route('GET', 'del-3')
  async removeThirdModule() {
    this.moduleManager.removeImport(ThirdModule);
    await this.reinitApp('third', 'removing');
  }

  private async reinitApp(moduleName: 'second' | 'third', action: 'importing' | 'removing') {
    const err = await this.appInitializer.reinit();
    if (err) {
      this.res.send(`${action} ${moduleName} failed: ${err.message}\n`);
    } else {
      this.res.send(`${moduleName} successfully ${action}!\n`);
    }
  }
}
