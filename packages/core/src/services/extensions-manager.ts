import { Injectable, InjectionToken, Injector } from '@ts-stack/di';

import { Extension } from '../types/mix';
import { Counter } from './counter';
import { Log } from './log';

@Injectable()
export class ExtensionsManager {
  protected unfinishedInitExtensions = new Set<Extension<any>>();

  constructor(private injectorPerApp: Injector, private log: Log, private counter: Counter) {}

  async init<T>(extensionsGroupToken: string | InjectionToken<Extension<T>[]>, autoMergeArrays = true): Promise<T[]> {
    const extensions = this.injectorPerApp.get(extensionsGroupToken, []);
    const dataArr: T[] = [];

    if (typeof extensionsGroupToken != 'string' && !extensions.length) {
      this.log.noExtensionsFound('warn', extensionsGroupToken);
    }

    for (const extension of extensions) {
      if (this.unfinishedInitExtensions.has(extension)) {
        this.throwCyclicDeps(extension);
      }

      const extensionName = extension.constructor.name;
      const id = this.counter.increaseExtensionsInitId();
      const args = [id, extensionName];
      this.unfinishedInitExtensions.add(extension);
      this.log.startInitExtension('debug', ...args);
      const data = await extension.init();
      this.log.finishInitExtension('debug', ...args);
      this.unfinishedInitExtensions.delete(extension);
      this.counter.addInitedExtensions(extension);
      if (data === undefined) {
        this.log.extensionInitReturnsVoid('debug', ...args);
        continue;
      }
      this.log.extensionInitReturnsValue('debug', ...args);
      if (autoMergeArrays && Array.isArray(data)) {
        dataArr.push(...data);
      } else {
        dataArr.push(data);
      }
    }
    return dataArr;
  }

  clearUnfinishedInitExtensions() {
    this.unfinishedInitExtensions.clear();
  }

  protected throwCyclicDeps(extension: Extension<any>) {
    const extensions = Array.from(this.unfinishedInitExtensions);
    const index = extensions.findIndex((ext) => ext === extension);
    const prefixChain = extensions.slice(0, index);
    const cyclicChain = extensions.slice(index);
    const prefixNames = prefixChain.map((ext) => ext.constructor.name).join(' -> ');
    let cyclicNames = cyclicChain.map((ext) => ext.constructor.name).join(' -> ');
    cyclicNames += ` -> ${extension.constructor.name}`;
    let msg = `Detected cyclic dependencies: ${cyclicNames}.`;
    if (prefixNames) {
      msg += ` It is started from ${prefixNames}.`;
    }
    throw new Error(msg);
  }
}
