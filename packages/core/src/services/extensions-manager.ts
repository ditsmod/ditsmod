import { Injectable, Injector } from '@ts-stack/di';

import { Extension } from '../types/extension';

@Injectable()
export class ExtensionsManager implements Extension {
  constructor(private injector: Injector) {}

  async init(extensionsGroupToken: any): Promise<any[]> {
    const extensions = this.injector.get(extensionsGroupToken, []) as Extension[];
    const dataArr: any[] = [];

    for (const extension of extensions) {
      const data = await extension.init();
      dataArr.push(...data);
    }
    return dataArr;
  }
}
