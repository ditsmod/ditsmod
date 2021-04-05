import { Injectable, InjectionToken, Injector } from '@ts-stack/di';

import { Extension } from '../types/extension';
import { Logger } from '../types/logger';
import { Counter } from './counter';

@Injectable()
export class ExtensionsManager {
  constructor(private injector: Injector, private log: Logger, private counter: Counter) {}

  async init<T>(extensionsGroupToken: InjectionToken<Extension<T>[]>, autoMergeArrays = true): Promise<T[]> {
    const extensions = this.injector.get(extensionsGroupToken, []);
    const dataArr: T[] = [];

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
      if (autoMergeArrays && Array.isArray(data)) {
        dataArr.push(...data);
      } else {
        dataArr.push(data);
      }
    }
    return dataArr;
  }
}
