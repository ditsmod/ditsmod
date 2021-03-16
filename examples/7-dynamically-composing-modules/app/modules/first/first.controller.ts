import { Controller, Response, Route, edk } from '@ditsmod/core';

import { SecondModule } from '../second/second.module';
import { ThirdModule } from '../third/third.module';

@Controller()
export class FirstController {
  constructor(
    private res: Response,
    private moduleManager: edk.ModuleManager,
    private appInitializer: edk.AppInitializer
  ) {}

  @Route('GET')
  tellHello() {
    this.res.send('first module.\n');
  }

  @Route('GET', 'add-2')
  async addSecondModule() {
    this.moduleManager.addImport(SecondModule);
    await this.appInitializer.reinit();
    this.res.send('Second module successfully added!\n');
  }

  @Route('GET', 'del-2')
  async removeSecondModule() {
    this.moduleManager.removeImport(SecondModule);
    await this.appInitializer.reinit();
    this.res.send('Second module successfully removed!\n');
  }

  @Route('GET', 'add-3')
  async addThirdModule() {
    this.moduleManager.addImport(ThirdModule);
    await this.appInitializer.reinit();
    this.res.send('Third module successfully added!\n');
  }

  @Route('GET', 'del-3')
  async removeThirdModule() {
    this.moduleManager.removeImport(ThirdModule);
    await this.appInitializer.reinit();
    this.res.send('Third module successfully removed!\n');
  }
}
