import { Injectable, Injector } from '@ts-stack/di';

import { Extension } from '../types/extension';
import { Logger } from '../types/logger';
import { Counter } from './counter';

@Injectable()
export class ExtensionsManager {
  constructor(private injector: Injector, private log: Logger, private counter: Counter) {}

  async init(extensionsGroupToken: any): Promise<any[]> {
    const extensions = this.injector.get(extensionsGroupToken, []) as Extension[];
    const dataArr: any[] = [];

    for (const extension of extensions) {
      const id = this.counter.increaseExtensionsInitId();
      const prefix = `${id}: ${extension.constructor.name}`;

      this.log.debug(`${prefix}: start init`);
      const data = await extension.init();
      this.log.debug(`${prefix}: finish init`);
      if (data === undefined) {
        this.log.debug(`${prefix}: init returned empty value`);
        continue;
      }
      this.log.debug(`${prefix}: init returned some value`);
      if (Array.isArray(data)) {
        dataArr.push(...data);
      } else {
        dataArr.push(data);
      }
    }
    return dataArr;
  }
}
