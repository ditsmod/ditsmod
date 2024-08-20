import { EXTENSIONS_COUNTERS } from '#constans';
import { Class, BeforeToken, Injector, KeyRegistry, inject, injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import {
  ExtensionsGroupToken,
  Extension,
  ExtensionInitMeta,
  ExtensionManagerInitMeta,
} from '#types/extension-types.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { isInjectionToken } from '#utils/type-guards.js';
import { Counter } from './counter.js';
import { ExtensionsContext } from './extensions-context.js';

class Cache {
  constructor(
    public groupToken: ExtensionsGroupToken<any>,
    public extensionManagerInitMeta: ExtensionManagerInitMeta,
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
  beforeTokens = new Set<BeforeToken>();
  protected unfinishedInit = new Set<Extension<any> | ExtensionsGroupToken<any>>();
  protected cache: Cache[] = [];

  constructor(
    private injector: Injector,
    private systemLogMediator: SystemLogMediator,
    private counter: Counter,
    private extensionsContext: ExtensionsContext,
    @inject(EXTENSIONS_COUNTERS) private mExtensionsCounters: Map<Class<Extension<any>>, number>,
  ) {}

  async init<T>(groupToken: ExtensionsGroupToken<T>): Promise<ExtensionManagerInitMeta> {
    /**
     * Initializes pair of group extensions with `BEFORE ${groupToken}` and `groupToken`. After that,
     * it returns the value from a group extensions with `groupToken`.
     */
    if (this.unfinishedInit.has(groupToken)) {
      this.throwCircularDeps(groupToken);
    }
    const beforeToken = KeyRegistry.getBeforeToken(groupToken);
    let cache = this.getCache(beforeToken);
    if (!cache && this.beforeTokens.has(beforeToken)) {
      this.unfinishedInit.add(beforeToken);
      this.systemLogMediator.startExtensionsGroupInit(this, this.unfinishedInit);
      const value = await this.initGroup(beforeToken);
      this.systemLogMediator.finishExtensionsGroupInit(this, this.unfinishedInit);
      this.unfinishedInit.delete(beforeToken);
      const newCache = new Cache(beforeToken, value);
      this.cache.push(newCache);
    }

    cache = this.getCache(groupToken);
    if (cache) {
      return cache.extensionManagerInitMeta;
    }
    this.unfinishedInit.add(groupToken);
    this.systemLogMediator.startExtensionsGroupInit(this, this.unfinishedInit);
    const extensionManagerInitMeta = await this.initGroup(groupToken);
    this.systemLogMediator.finishExtensionsGroupInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(groupToken);
    const newCache = new Cache(groupToken, extensionManagerInitMeta);
    this.cache.push(newCache);
    return extensionManagerInitMeta;
  }

  protected async initGroup<T>(groupToken: ExtensionsGroupToken<any>): Promise<ExtensionManagerInitMeta> {
    const extensions = this.injector.get(groupToken, undefined, []) as Extension<T>[];
    const aInitMeta: ExtensionInitMeta<T>[] = [];
    const extensionManagerInitMeta = new ExtensionManagerInitMeta(aInitMeta);

    if (!extensions.length) {
      this.systemLogMediator.noExtensionsFound(this, groupToken);
    }

    for (const extension of extensions) {
      if (this.unfinishedInit.has(extension)) {
        this.throwCircularDeps(extension);
      }

      this.unfinishedInit.add(extension);
      this.systemLogMediator.startInitExtension(this, this.unfinishedInit);
      const countdown = this.mExtensionsCounters.get(extension.constructor as Class<Extension<T>>) || 0;
      const isLastExtensionCall = countdown === 0;
      const data = await extension.init(isLastExtensionCall);
      this.systemLogMediator.finishInitExtension(this, this.unfinishedInit, data);
      this.counter.addInitedExtensions(extension);
      this.unfinishedInit.delete(extension);
      extensionManagerInitMeta.countdown = Math.max(extensionManagerInitMeta.countdown, countdown);
      if (!extensionManagerInitMeta.delay && !isLastExtensionCall) {
        extensionManagerInitMeta.delay = true;
      }
      const initMeta = new ExtensionInitMeta(extension, data, !isLastExtensionCall, countdown);
      aInitMeta.push(initMeta);
    }

    return extensionManagerInitMeta;
  }

  protected getCache(groupToken: ExtensionsGroupToken) {
    return this.cache.find((c) => c.groupToken == groupToken);
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
