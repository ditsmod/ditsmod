import { Injectable, InjectionToken, Injector } from '@ts-stack/di';

import { Extension } from '../types/mix';
import { Counter } from './counter';
import { LogMediator } from './log-mediator';

@Injectable()
export class ExtensionsManager {
  protected unfinishedInitExtensions = new Set<Extension<any>>();

  constructor(private injectorPerMod: Injector, private logMediator: LogMediator, private counter: Counter) {}

  async init<T>(extensionsGroupToken: string | InjectionToken<Extension<T>[]>, autoMergeArrays = true): Promise<T[]> {
    const extensions = this.injectorPerMod.get(extensionsGroupToken, []);
    const dataArr: T[] = [];

    if (typeof extensionsGroupToken != 'string' && !extensions.length) {
      this.logMediator.noExtensionsFound('warn', { className: this.constructor.name }, extensionsGroupToken);
    }

    for (const extension of extensions) {
      if (this.unfinishedInitExtensions.has(extension)) {
        this.throwCyclicDeps(extension);
      }

      const extensionName = extension.constructor.name;
      const id = this.counter.increaseExtensionsInitId();
      const args = [id, extensionName];
      this.unfinishedInitExtensions.add(extension);
      this.logMediator.startInitExtension('debug', { className: this.constructor.name }, ...args);
      const data = await extension.init();
      this.logMediator.finishInitExtension('debug', { className: this.constructor.name }, ...args);
      this.unfinishedInitExtensions.delete(extension);
      this.counter.addInitedExtensions(extension);
      if (data === undefined) {
        this.logMediator.extensionInitReturnsVoid('debug', { className: this.constructor.name }, ...args);
        continue;
      }
      this.logMediator.extensionInitReturnsValue('debug', { className: this.constructor.name }, ...args);
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
