import { Injectable, InjectionToken, Injector } from '@ts-stack/di';

import { Extension } from '../types/mix';
import { Counter } from './counter';
import { LogMediator } from './log-mediator';

export class ExtensionsManagerPerApp {
  protected map = new Map<string | InjectionToken<Extension<any>[]>, any[]>();

  async init<T>(extensionsGroupToken: string | InjectionToken<Extension<T>[]>): Promise<T[]> {
    return this.map.get(extensionsGroupToken)!;
  }

  setData<T>(extensionsGroupToken: string | InjectionToken<Extension<T>[]>, data: T[]) {
    let arr = this.map.get(extensionsGroupToken);
    if (arr) {
      arr.push(...data);
      this.map.set(extensionsGroupToken, arr);
    } else {
      this.map.set(extensionsGroupToken, data);
    }
  }
}

@Injectable()
export class ExtensionsManagerPerMod {
  protected unfinishedInitExtensions = new Set<Extension<any>>();

  constructor(private injector: Injector, private logMediator: LogMediator, private counter: Counter) {}

  async init<T>(extensionsGroupToken: string | InjectionToken<Extension<T>[]>, autoMergeArrays = true): Promise<T[]> {
    const extensions = this.injector.get(extensionsGroupToken, []);
    const dataArr: T[] = [];
    const filterConfig = { className: this.constructor.name };

    if (typeof extensionsGroupToken != 'string' && !extensions.length) {
      this.logMediator.noExtensionsFound('warn', filterConfig, extensionsGroupToken);
    }

    for (const extension of extensions) {
      if (this.unfinishedInitExtensions.has(extension)) {
        this.throwCyclicDeps(extension);
      }

      const extensionName = extension.constructor.name;
      const id = this.counter.increaseExtensionsInitId();
      const args = [id, extensionName];
      this.unfinishedInitExtensions.add(extension);
      this.logMediator.startInitExtension('debug', filterConfig, ...args);
      const data = await extension.init();
      this.logMediator.finishInitExtension('debug', filterConfig, ...args);
      this.unfinishedInitExtensions.delete(extension);
      this.counter.addInitedExtensions(extension);
      if (data === undefined) {
        this.logMediator.extensionInitReturnsVoid('debug', filterConfig, ...args);
        continue;
      }
      this.logMediator.extensionInitReturnsValue('debug', filterConfig, ...args);
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
