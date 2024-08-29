import { Class, BeforeToken, Injector, KeyRegistry, injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import {
  ExtensionsGroupToken,
  Extension,
  ExtensionInitMeta,
  ExtensionManagerInitMeta,
  ExtensionCounters,
} from '#types/extension-types.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { isInjectionToken } from '#utils/type-guards.js';
import { Counter } from './counter.js';
import { ExtensionsContext } from './extensions-context.js';

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
  protected unfinishedInit = new Set<Extension | ExtensionsGroupToken>();
  /**
   * The cache for the current module.
   */
  protected cache = new Map<ExtensionsGroupToken, ExtensionManagerInitMeta>();

  constructor(
    protected injector: Injector,
    protected systemLogMediator: SystemLogMediator,
    protected counter: Counter,
    protected extensionsContext: ExtensionsContext,
    protected extensionCounters: ExtensionCounters,
  ) {}

  async init<T>(groupToken: ExtensionsGroupToken<T>, perApp?: boolean): Promise<ExtensionManagerInitMeta<T>> {
    if (this.unfinishedInit.has(groupToken)) {
      this.throwCircularDeps(groupToken);
    }
    if (perApp && this.unfinishedInit.size > 1) {
      this.addExtensionToWaitingStack(groupToken);
    }
    const beforeToken = KeyRegistry.getBeforeToken(groupToken);
    if (!this.cache.has(beforeToken) && this.beforeTokens.has(beforeToken)) {
      await this.prepareAndInitGroup<T>(beforeToken);
    }

    let totalInitMeta = this.cache.get(groupToken);
    if (totalInitMeta) {
      this.updateCounters(groupToken, totalInitMeta);
      return totalInitMeta;
    }

    totalInitMeta = await this.prepareAndInitGroup<T>(groupToken);
    totalInitMeta.totalInitMetaPerApp = this.extensionsContext.mTotalInitMeta.get(groupToken)!;
    return totalInitMeta;
  }

  /**
   * Adds to the waiting stack an extension that wants to receive
   * the initialization result of `groupToken` from the entire application.
   */
  protected addExtensionToWaitingStack(groupToken: ExtensionsGroupToken) {
    const caller = Array.from(this.unfinishedInit).at(-1) as Extension;
    const mExtensions = this.extensionsContext.mCaller.get(groupToken) || new Map<Class<Extension>, Extension>();
    const ExtensionClass = caller.constructor as Class<Extension>;
    if (!mExtensions.has(ExtensionClass)) {
      mExtensions.set(ExtensionClass, caller);
      this.extensionsContext.mCaller.set(groupToken, mExtensions);
    }
  }

  protected async prepareAndInitGroup<T>(groupToken: ExtensionsGroupToken<T>) {
    this.unfinishedInit.add(groupToken);
    this.systemLogMediator.startExtensionsGroupInit(this, this.unfinishedInit);
    const totalInitMeta = await this.initGroup(groupToken);
    this.systemLogMediator.finishExtensionsGroupInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(groupToken);
    this.cache.set(groupToken, totalInitMeta);

    const aTotalInitMeta = this.extensionsContext.mTotalInitMeta.get(groupToken) || [];
    aTotalInitMeta.push(totalInitMeta);
    this.extensionsContext.mTotalInitMeta.set(groupToken, aTotalInitMeta);

    return totalInitMeta;
  }

  protected async initGroup<T>(groupToken: ExtensionsGroupToken): Promise<ExtensionManagerInitMeta> {
    const extensions = this.injector.get(groupToken, undefined, []) as Extension<T>[];
    const groupInitMeta: ExtensionInitMeta<T>[] = [];
    const totalInitMeta = new ExtensionManagerInitMeta(this.moduleName, groupToken, groupInitMeta);
    this.updateCounters(groupToken, totalInitMeta);

    if (!extensions.length) {
      this.systemLogMediator.noExtensionsFound(this, groupToken, this.unfinishedInit);
    }

    for (const extension of extensions) {
      if (this.unfinishedInit.has(extension)) {
        this.throwCircularDeps(extension);
      }

      this.unfinishedInit.add(extension);
      this.systemLogMediator.startInitExtension(this, this.unfinishedInit);
      const countdown = this.extensionCounters.mExtensions.get(extension.constructor as Class<Extension<T>>) || 0;
      const isLastExtensionCall = countdown === 0;
      const data = await extension.init(isLastExtensionCall);
      this.systemLogMediator.finishInitExtension(this, this.unfinishedInit, data);
      this.counter.addInitedExtensions(extension);
      this.unfinishedInit.delete(extension);
      const initMeta = new ExtensionInitMeta(extension, data, !isLastExtensionCall, countdown);
      groupInitMeta.push(initMeta);
    }

    return totalInitMeta;
  }

  protected updateCounters(groupToken: ExtensionsGroupToken, totalInitMeta: ExtensionManagerInitMeta) {
    totalInitMeta.countdown = this.extensionCounters.mGroupTokens.get(groupToken)!;
    totalInitMeta.delay = totalInitMeta.countdown > 0;
  }

  protected throwCircularDeps(item: Extension | ExtensionsGroupToken) {
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

  protected getItemName(tokenOrExtension: Extension | ExtensionsGroupToken) {
    if (isInjectionToken(tokenOrExtension) || typeof tokenOrExtension == 'string') {
      return getProviderName(tokenOrExtension);
    } else {
      return tokenOrExtension.constructor.name;
    }
  }
}
