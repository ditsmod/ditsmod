import { Inject, Injectable, Injector, Type } from '@ts-stack/di';
import { EXTENSIONS_COUNTERS } from '../constans';

import { Extension, ExtensionsGroupToken } from '../types/mix';
import { Counter } from './counter';
import { ExtensionsContext } from './extensions-context';
import { LogMediator } from './log-mediator';

@Injectable()
export class ExtensionsManager {
  protected unfinishedInitExtensions = new Set<Extension<any>>();

  constructor(
    private injector: Injector,
    private logMediator: LogMediator,
    private counter: Counter,
    private extensionsContext: ExtensionsContext,
    @Inject(EXTENSIONS_COUNTERS) private mExtensionsCounters: Map<Type<Extension<any>>, number>
  ) {}

  // prettier-ignore
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays: boolean, extension: Type<Extension<any>>): Promise<T[] | false>;
  // prettier-ignore
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays?: boolean, extension?: Type<Extension<any>>): Promise<T[]>;
  // prettier-ignore
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays = true, extension?: Type<Extension<any>>): Promise<T[] | false> {
    const extensions = this.injector.get(groupToken, []) as Extension<T>[];
    const aCurrentData: T[] = [];

    if (!extensions.length) {
      this.logMediator.noExtensionsFound(this, groupToken);
    }

    for (const extension of extensions) {
      if (this.unfinishedInitExtensions.has(extension)) {
        this.throwCircularDeps(extension);
      }

      this.unfinishedInitExtensions.add(extension);
      this.logMediator.startInitExtension(this, this.unfinishedInitExtensions);
      const isLastExtensionCall = this.mExtensionsCounters.get(extension.constructor as Type<Extension<T>>) === 0;
      const data = await extension.init(isLastExtensionCall);
      this.logMediator.finishInitExtension(this, this.unfinishedInitExtensions, data);
      this.counter.addInitedExtensions(extension);
      this.unfinishedInitExtensions.delete(extension);
      if (data === undefined) {
        continue;
      }
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

  protected getDataFromAllModules<T>(
    groupToken: ExtensionsGroupToken<T>,
    extension: Type<Extension<T>>,
    aCurrentData: T[]
  ) {
    const { mExtensionsData: mAllExtensionsData } = this.extensionsContext;
    const mExtensionData = mAllExtensionsData.get(extension);
    const aGroupData = mExtensionData?.get(groupToken);
    const isLastExtensionCall = this.mExtensionsCounters.get(extension) === 0;

    if (isLastExtensionCall) {
      if (aGroupData) {
        return [...aGroupData, ...aCurrentData];
      } else {
        return aCurrentData;
      }
    } else {
      if (!mExtensionData) {
        mAllExtensionsData.set(extension, new Map([[groupToken, aCurrentData]]));
      } else {
        if (aGroupData) {
          aGroupData.push(...aCurrentData);
        } else {
          mExtensionData.set(groupToken, aCurrentData);
        }
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
