import { Injectable, InjectionToken, Injector, Type } from '@ts-stack/di';

import { Extension } from '../types/mix';
import { Counter } from './counter';
import { ExtensionsContext } from './extensions-context';
import { LogMediator } from './log-mediator';

export type ExtensionsGroupToken<T = any> = InjectionToken<Extension<T>[]> | `BEFORE ${string}`;

@Injectable()
export class ExtensionsManager {
  protected unfinishedInitExtensions = new Set<Extension<any>>();

  constructor(
    private injector: Injector,
    private logMediator: LogMediator,
    private counter: Counter,
    private extensionsContext: ExtensionsContext
  ) {}

  // prettier-ignore
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays: boolean, extension: Type<Extension<any>>): Promise<T[] | false>;
  // prettier-ignore
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays?: boolean, extension?: Type<Extension<any>>): Promise<T[]>;
  // prettier-ignore
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays = true, extension?: Type<Extension<any>>): Promise<T[] | false> {
    const extensions = this.injector.get(groupToken, []) as Extension<T>[];
    const aCurrentData: T[] = [];
    const filterConfig = { className: this.constructor.name };

    if (typeof groupToken != 'string' && !extensions.length) {
      this.logMediator.noExtensionsFound('warn', filterConfig, groupToken);
    }

    for (const extension of extensions) {
      if (this.unfinishedInitExtensions.has(extension)) {
        this.throwCircularDeps(extension);
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
        aCurrentData.push(...data);
      } else {
        aCurrentData.push(data);
      }
    }
    if (extension) {
      return this.getDataFromAllModules(groupToken, extension, aCurrentData);
    } else {
      return aCurrentData;
    }
  }

  clearUnfinishedInitExtensions() {
    this.unfinishedInitExtensions.clear();
  }

  protected getDataFromAllModules<T>(
    groupToken: ExtensionsGroupToken<T>,
    extension: Type<Extension<T>>,
    aCurrentData: T[]
  ) {
    const { isLastModule, mExtensionsData } = this.extensionsContext;
    let mGroupsData = mExtensionsData.get(extension);
    if (isLastModule) {
      if (!mGroupsData) {
        return aCurrentData;
      }
      const aPrevData = mGroupsData.get(groupToken);
      if (aPrevData) {
        return [...aPrevData, ...aCurrentData]
      } else {
        return aCurrentData;
      }
    } else {
      if (!mGroupsData) {
        mExtensionsData.set(extension, new Map([[groupToken, aCurrentData]]))
      } else {
        const aPrevData = mGroupsData.get(groupToken);
        aPrevData?.push(...aCurrentData);
      }
      return false;
    }
  }

  protected throwCircularDeps(extension: Extension<any>) {
    const extensions = Array.from(this.unfinishedInitExtensions);
    const index = extensions.findIndex((ext) => ext === extension);
    const prefixChain = extensions.slice(0, index);
    const circularChain = extensions.slice(index);
    const prefixNames = prefixChain.map((ext) => ext.constructor.name).join(' -> ');
    let circularNames = circularChain.map((ext) => ext.constructor.name).join(' -> ');
    circularNames += ` -> ${extension.constructor.name}`;
    let msg = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg += ` It is started from ${prefixNames}.`;
    }
    throw new Error(msg);
  }
}
