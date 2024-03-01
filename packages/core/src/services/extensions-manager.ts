import { EXTENSIONS_COUNTERS } from '#constans';
import { Class, Injector, inject, injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { Extension, ExtensionsGroupToken } from '#types/mix.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { isInjectionToken } from '#utils/type-guards.js';
import { Counter } from './counter.js';
import { ExtensionsContext } from './extensions-context.js';

class Cache {
  constructor(
    public groupToken: ExtensionsGroupToken<any>,
    public value: any[] | false,
    public autoMergeArrays?: boolean,
    public extension?: Class<Extension<any>>,
  ) {}
}

@injectable()
export class ExtensionsManager {
  /**
   * Settings by AppInitializer.
   */
  moduleName: string = '';
  /**
   * Settings by AppInitializer.
   */
  beforeTokens = new Set<string>();
  protected unfinishedInit = new Set<Extension<any> | ExtensionsGroupToken<any>>();
  protected cache: Cache[] = [];

  constructor(
    private injector: Injector,
    private systemLogMediator: SystemLogMediator,
    private counter: Counter,
    private extensionsContext: ExtensionsContext,
    @inject(EXTENSIONS_COUNTERS) private mExtensionsCounters: Map<Class<Extension<any>>, number>,
  ) {}

  async init<T>(
    groupToken: ExtensionsGroupToken<T>,
    autoMergeArrays: boolean,
    ExtensionAwaiting: Class<Extension<any>>,
  ): Promise<T[] | false>;
  async init<T>(groupToken: ExtensionsGroupToken<T>, autoMergeArrays?: boolean): Promise<T[]>;
  async init<T>(
    groupToken: ExtensionsGroupToken<T>,
    autoMergeArrays = true,
    ExtensionAwaiting?: Class<Extension<any>>,
  ): Promise<T[] | false> {
    /**
     * Initializes pair of group extensions with `BEFORE ${someGroupToken}` and `someGroupToken`. After that,
     * it returns the value from a group extensions with `someGroupToken`.
     */
    if (this.unfinishedInit.has(groupToken)) {
      this.throwCircularDeps(groupToken);
    }
    const beforeToken = `BEFORE ${groupToken}` as const;
    let cache = this.getCache(beforeToken);
    if (!cache && this.beforeTokens.has(beforeToken)) {
      this.unfinishedInit.add(beforeToken);
      this.systemLogMediator.startExtensionsGroupInit(this, this.unfinishedInit);
      const value = await this.initGroup(beforeToken);
      this.systemLogMediator.finishExtensionsGroupInit(this, this.unfinishedInit);
      this.unfinishedInit.delete(beforeToken);
      const newCache = new Cache(beforeToken, value, autoMergeArrays, ExtensionAwaiting);
      this.cache.push(newCache);
    }

    cache = this.getCache(groupToken, autoMergeArrays, ExtensionAwaiting);
    if (cache) {
      return cache.value;
    }
    this.unfinishedInit.add(groupToken);
    this.systemLogMediator.startExtensionsGroupInit(this, this.unfinishedInit);
    const value = await this.initGroup(groupToken, autoMergeArrays, ExtensionAwaiting);
    this.systemLogMediator.finishExtensionsGroupInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(groupToken);
    const newCache = new Cache(groupToken, value, autoMergeArrays, ExtensionAwaiting);
    this.cache.push(newCache);
    return value;
  }

  protected async initGroup<T>(
    groupToken: ExtensionsGroupToken<any>,
    autoMergeArrays?: boolean,
    ExtensionAwaiting?: Class<Extension<any>>,
  ): Promise<any[] | false> {
    const extensions = this.injector.get(groupToken, undefined, []) as Extension<T>[];
    const aCurrentData: T[] = [];

    if (!extensions.length) {
      this.systemLogMediator.noExtensionsFound(this, groupToken);
    }

    for (const extension of extensions) {
      if (this.unfinishedInit.has(extension)) {
        this.throwCircularDeps(extension);
      }

      this.unfinishedInit.add(extension);
      this.systemLogMediator.startInitExtension(this, this.unfinishedInit);
      const isLastExtensionCall = this.mExtensionsCounters.get(extension.constructor as Class<Extension<T>>) === 0;
      const data = await extension.init(isLastExtensionCall);
      this.systemLogMediator.finishInitExtension(this, this.unfinishedInit, data);
      this.counter.addInitedExtensions(extension);
      this.unfinishedInit.delete(extension);
      if (data === undefined) {
        continue;
      }
      if (autoMergeArrays && Array.isArray(data)) {
        aCurrentData.push(...data);
      } else {
        aCurrentData.push(data);
      }
    }

    if (ExtensionAwaiting) {
      return this.getDataFromAllModules(groupToken, ExtensionAwaiting, aCurrentData);
    } else {
      return aCurrentData;
    }
  }

  protected getCache(groupToken: ExtensionsGroupToken, autoMergeArrays = true, extension?: Class<Extension<any>>) {
    return this.cache.find((c) => {
      return c.groupToken == groupToken && c.autoMergeArrays == autoMergeArrays && c.extension === extension;
    });
  }

  protected getDataFromAllModules<T>(
    groupToken: ExtensionsGroupToken<T>,
    extension: Class<Extension<T>>,
    aCurrentData: T[],
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

  protected throwCircularDeps(item: Extension<any> | ExtensionsGroupToken<any>) {
    const items = Array.from(this.unfinishedInit);
    const index = items.findIndex((ext) => ext === item);
    const prefixChain = items.slice(0, index);
    const circularChain = items.slice(index);
    const prefixNames = prefixChain.map(this.getItemName).join(' -> ');
    let circularNames = circularChain.map(this.getItemName).join(' -> ');
    circularNames += ` -> ${this.getItemName(item)}`;
    let msg = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg += ` It is started from ${prefixNames}.`;
    }
    throw new Error(msg);
  }

  protected getItemName(tokenOrExtension: Extension<any> | ExtensionsGroupToken<any>) {
    if (isInjectionToken(tokenOrExtension) || typeof tokenOrExtension == 'string') {
      return getProviderName(tokenOrExtension);
    } else {
      return tokenOrExtension.constructor.name;
    }
  }
}
