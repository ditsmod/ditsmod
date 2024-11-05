import { Class, BeforeToken, Injector, KeyRegistry, injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import {
  ExtensionsGroupToken,
  Extension,
  ExtensionInitMeta,
  TotalInitMeta,
  ExtensionCounters,
  TotalInitMeta2,
} from '#types/extension-types.js';
import { OptionalProps } from '#types/mix.js';
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
  protected cache = new Map<ExtensionsGroupToken, TotalInitMeta>();
  protected excludedExtensionPendingList = new Map<ExtensionsGroupToken, Set<Class<Extension>>>();

  constructor(
    protected injector: Injector,
    protected systemLogMediator: SystemLogMediator,
    protected counter: Counter,
    protected extensionsContext: ExtensionsContext,
    protected extensionCounters: ExtensionCounters,
  ) {}

  async init<T>(groupToken: ExtensionsGroupToken<T>, perApp?: false): Promise<TotalInitMeta<T>>;
  async init<T>(groupToken: ExtensionsGroupToken<T>, perApp: true): Promise<TotalInitMeta2<T>>;
  async init<T>(groupToken: ExtensionsGroupToken<T>, perApp?: boolean): Promise<TotalInitMeta<T>> {
    if (this.unfinishedInit.has(groupToken)) {
      this.throwCircularDeps(groupToken);
    }
    if (perApp && this.unfinishedInit.size > 1) {
      this.addExtensionToPendingList(groupToken);
    }
    const beforeToken = KeyRegistry.getBeforeToken(groupToken);
    if (!this.cache.has(beforeToken) && this.beforeTokens.has(beforeToken)) {
      await this.prepareAndInitGroup<T>(beforeToken);
    }

    let totalInitMeta = this.cache.get(groupToken);
    if (totalInitMeta) {
      this.updateGroupCounters(groupToken, totalInitMeta);
      totalInitMeta = this.prepareTotalInitMetaPerApp(totalInitMeta, perApp);
      if (perApp && !totalInitMeta.delay) {
        this.excludeExtensionFromPendingList(groupToken);
      }
      return totalInitMeta;
    }

    totalInitMeta = await this.prepareAndInitGroup<T>(groupToken);
    totalInitMeta.totalInitMetaPerApp = this.extensionsContext.mTotalInitMeta.get(groupToken)!;
    totalInitMeta = this.prepareTotalInitMetaPerApp(totalInitMeta, perApp);
    if (perApp && !totalInitMeta.delay) {
      this.excludeExtensionFromPendingList(groupToken);
    }
    return totalInitMeta;
  }

  updateExtensionPendingList() {
    for (const [groupToken, sExtensions] of this.excludedExtensionPendingList) {
      for (const ExtensionClass of sExtensions) {
        const mExtensions = this.extensionsContext.mExtensionPendingList.get(groupToken)!;
        mExtensions.delete(ExtensionClass);
      }
    }
  }

  protected prepareTotalInitMetaPerApp(totalInitMeta: TotalInitMeta2, perApp?: boolean): TotalInitMeta {
    if (perApp && !totalInitMeta.delay) {
      const copytotalInitMeta = { ...totalInitMeta };
      delete (copytotalInitMeta as TotalInitMeta2).groupInitMeta;
      delete (copytotalInitMeta as TotalInitMeta2).moduleName;
      delete (copytotalInitMeta as TotalInitMeta2).countdown;
      return copytotalInitMeta as TotalInitMeta;
    }
    return totalInitMeta as TotalInitMeta;
  }

  /**
   * Adds to the pending list of extensions that want to receive the initialization
   * result of `groupToken` from the whole application.
   */
  protected addExtensionToPendingList(groupToken: ExtensionsGroupToken) {
    const caller = Array.from(this.unfinishedInit).at(-1) as Extension;
    const ExtensionClass = caller.constructor as Class<Extension>;
    const mExtensions =
      this.extensionsContext.mExtensionPendingList.get(groupToken) || new Map<Class<Extension>, Extension>();

    if (!mExtensions.has(ExtensionClass)) {
      mExtensions.set(ExtensionClass, caller);
      this.extensionsContext.mExtensionPendingList.set(groupToken, mExtensions);
    }
  }

  protected excludeExtensionFromPendingList(groupToken: ExtensionsGroupToken) {
    const caller = Array.from(this.unfinishedInit).at(-1) as Extension;
    if (!caller) {
      return;
    }
    const ExtensionClass = caller.constructor as Class<Extension>;
    const excludedExtensions = this.excludedExtensionPendingList.get(groupToken) || new Set<Class<Extension>>();
    excludedExtensions.add(ExtensionClass);
    this.excludedExtensionPendingList.set(groupToken, excludedExtensions);
  }

  protected async prepareAndInitGroup<T>(groupToken: ExtensionsGroupToken<T>) {
    this.unfinishedInit.add(groupToken);
    this.systemLogMediator.startExtensionsGroupInit(this, this.unfinishedInit);
    const totalInitMeta = await this.initGroup(groupToken);
    this.systemLogMediator.finishExtensionsGroupInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(groupToken);
    this.cache.set(groupToken, totalInitMeta);
    this.setTotalInitMetaPerApp(groupToken, totalInitMeta);
    return totalInitMeta;
  }

  protected setTotalInitMetaPerApp(groupToken: ExtensionsGroupToken, totalInitMeta: TotalInitMeta) {
    const copyTotalInitMeta = { ...totalInitMeta } as TotalInitMeta;
    delete (copyTotalInitMeta as OptionalProps<TotalInitMeta, 'totalInitMetaPerApp'>).totalInitMetaPerApp;
    const aTotalInitMeta = this.extensionsContext.mTotalInitMeta.get(groupToken) || [];
    aTotalInitMeta.push(copyTotalInitMeta);
    this.extensionsContext.mTotalInitMeta.set(groupToken, aTotalInitMeta);
  }

  protected async initGroup<T>(groupToken: ExtensionsGroupToken): Promise<TotalInitMeta> {
    const extensions = this.injector.get(groupToken, undefined, []) as Extension<T>[];
    const groupInitMeta: ExtensionInitMeta<T>[] = [];
    const totalInitMeta = new TotalInitMeta(this.moduleName, groupInitMeta);
    this.updateGroupCounters(groupToken, totalInitMeta);

    if (!extensions.length) {
      this.systemLogMediator.noExtensionsFound(this, groupToken, this.unfinishedInit);
    }

    for (const extension of extensions) {
      if (this.unfinishedInit.has(extension)) {
        this.throwCircularDeps(extension);
      }

      this.unfinishedInit.add(extension);
      this.systemLogMediator.startInitExtension(this, this.unfinishedInit);
      const ExtensionClass = extension.constructor as Class<Extension<T>>;
      const countdown = this.extensionCounters.mExtensions.get(ExtensionClass) || 0;
      const isLastModule = countdown === 0;
      const data = await extension.init(isLastModule);
      this.systemLogMediator.finishInitExtension(this, this.unfinishedInit, data);
      this.counter.addInitedExtensions(extension);
      this.unfinishedInit.delete(extension);
      const initMeta = new ExtensionInitMeta(extension, data, !isLastModule, countdown);
      groupInitMeta.push(initMeta);
    }

    return totalInitMeta;
  }

  protected updateGroupCounters(groupToken: ExtensionsGroupToken, totalInitMeta: TotalInitMeta) {
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
