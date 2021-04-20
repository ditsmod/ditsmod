import { Injectable, InjectionToken, Injector } from '@ts-stack/di';

import { Extension } from '../types/mix';
import { Counter } from './counter';
import { Log } from './log';

@Injectable()
export class ExtensionsManager {
  constructor(private injectorPerApp: Injector, private log: Log, private counter: Counter) {}

  async init<T>(extensionsGroupToken: InjectionToken<Extension<T>[]>, autoMergeArrays = true): Promise<T[]> {
    const extensions = this.injectorPerApp.get(extensionsGroupToken, []);
    const dataArr: T[] = [];

    if (!extensions.length) {
      this.log.noExtensionsFound('warn', [extensionsGroupToken]);
    }

    for (const extension of extensions) {
      const id = this.counter.increaseExtensionsInitId();

      this.log.startInitExtension('debug', [id, extension.constructor.name]);
      const data = await extension.init();
      this.log.finishInitExtension('debug', [id, extension.constructor.name]);
      this.counter.addInitedExtensions(extension);
      if (data === undefined) {
        this.log.extensionInitReturnsVoid('debug', [id, extension.constructor.name]);
        continue;
      }
      this.log.extensionInitReturnsValue('debug', [id, extension.constructor.name]);
      if (autoMergeArrays && Array.isArray(data)) {
        dataArr.push(...data);
      } else {
        dataArr.push(data);
      }
    }
    return dataArr;
  }
}
