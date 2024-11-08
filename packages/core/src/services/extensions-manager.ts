import { Class, BeforeToken, Injector, KeyRegistry, injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import {
  ExtensionsGroupToken,
  Extension,
  ExtensionStage1Meta,
  TotalStage1Meta,
  ExtensionCounters,
  TotalStage1Meta2,
} from '#types/extension-types.js';
import { OptionalProps } from '#types/mix.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { isInjectionToken } from '#utils/type-guards.js';
import { AnyModule } from '../imports-resolver.js';
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
  protected cache = new Map<ExtensionsGroupToken, TotalStage1Meta>();
  protected excludedExtensionPendingList = new Map<ExtensionsGroupToken, Set<Class<Extension>>>();
  protected extensionsListForStage2 = new Set<Extension>();

  constructor(
    protected injector: Injector,
    protected systemLogMediator: SystemLogMediator,
    protected counter: Counter,
    protected extensionsContext: ExtensionsContext,
    protected extensionCounters: ExtensionCounters,
  ) {}

  async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: false): Promise<TotalStage1Meta<T>>;
  async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp: true): Promise<TotalStage1Meta2<T>>;
  async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: boolean): Promise<TotalStage1Meta<T>> {
    if (this.unfinishedInit.has(groupToken)) {
      this.throwCircularDeps(groupToken);
    }

    // this.unfinishedInit is empty during metadata collection from all modules.
    if (perApp && this.unfinishedInit.size > 1) {
      this.addExtensionToPendingList(groupToken);
    }
    const beforeToken = KeyRegistry.getBeforeToken(groupToken);
    if (!this.cache.has(beforeToken) && this.beforeTokens.has(beforeToken)) {
      await this.prepareAndInitGroup<T>(beforeToken);
    }

    let totalStage1Meta = this.cache.get(groupToken);
    if (totalStage1Meta) {
      this.updateGroupCounters(groupToken, totalStage1Meta);
      totalStage1Meta = this.prepareTotalStage1MetaPerApp(totalStage1Meta, perApp);
      if (perApp && !totalStage1Meta.delay) {
        this.excludeExtensionFromPendingList(groupToken);
      }
      return totalStage1Meta;
    }

    totalStage1Meta = await this.prepareAndInitGroup<T>(groupToken);
    totalStage1Meta.totalStage1MetaPerApp = this.extensionsContext.mTotalStage1Meta.get(groupToken)!;
    totalStage1Meta = this.prepareTotalStage1MetaPerApp(totalStage1Meta, perApp);
    if (perApp && !totalStage1Meta.delay) {
      this.excludeExtensionFromPendingList(groupToken);
    }
    return totalStage1Meta;
  }

  updateExtensionPendingList() {
    for (const [groupToken, sExtensions] of this.excludedExtensionPendingList) {
      for (const ExtensionClass of sExtensions) {
        const mExtensions = this.extensionsContext.mExtensionPendingList.get(groupToken)!;
        mExtensions.delete(ExtensionClass);
      }
    }
  }

  setExtensionsToStage2(mod: AnyModule) {
    this.extensionsContext.mStage.set(mod, this.extensionsListForStage2);
  }

  protected prepareTotalStage1MetaPerApp(totalStage1Meta: TotalStage1Meta2, perApp?: boolean): TotalStage1Meta {
    if (perApp && !totalStage1Meta.delay) {
      const copytotalStage1Meta = { ...totalStage1Meta };
      delete (copytotalStage1Meta as TotalStage1Meta2).aExtStage1Meta;
      delete (copytotalStage1Meta as TotalStage1Meta2).moduleName;
      delete (copytotalStage1Meta as TotalStage1Meta2).countdown;
      return copytotalStage1Meta as TotalStage1Meta;
    }
    return totalStage1Meta as TotalStage1Meta;
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
    const totalStage1Meta = await this.initGroup(groupToken);
    this.systemLogMediator.finishExtensionsGroupInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(groupToken);
    this.cache.set(groupToken, totalStage1Meta);
    this.setTotalStage1MetaPerApp(groupToken, totalStage1Meta);
    return totalStage1Meta;
  }

  protected setTotalStage1MetaPerApp(groupToken: ExtensionsGroupToken, totalStage1Meta: TotalStage1Meta) {
    const copyTotalStage1Meta = { ...totalStage1Meta } as TotalStage1Meta;
    delete (copyTotalStage1Meta as OptionalProps<TotalStage1Meta, 'totalStage1MetaPerApp'>).totalStage1MetaPerApp;
    const aTotalStage1Meta = this.extensionsContext.mTotalStage1Meta.get(groupToken) || [];
    aTotalStage1Meta.push(copyTotalStage1Meta);
    this.extensionsContext.mTotalStage1Meta.set(groupToken, aTotalStage1Meta);
  }

  protected async initGroup<T>(groupToken: ExtensionsGroupToken): Promise<TotalStage1Meta> {
    const extensions = this.injector.get(groupToken, undefined, []) as Extension<T>[];
    const aExtStage1Meta: ExtensionStage1Meta<T | undefined>[] = [];
    const totalStage1Meta = new TotalStage1Meta(this.moduleName, aExtStage1Meta);
    this.updateGroupCounters(groupToken, totalStage1Meta);

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
      const data = await extension.stage1?.(isLastModule);
      this.extensionsListForStage2.add(extension);
      this.systemLogMediator.finishInitExtension(this, this.unfinishedInit, data);
      this.counter.addInitedExtensions(extension);
      this.unfinishedInit.delete(extension);
      const stage1Meta = new ExtensionStage1Meta(extension, data, !isLastModule, countdown);
      aExtStage1Meta.push(stage1Meta);
    }

    return totalStage1Meta;
  }

  protected updateGroupCounters(groupToken: ExtensionsGroupToken, totalStage1Meta: TotalStage1Meta) {
    totalStage1Meta.countdown = this.extensionCounters.mGroupTokens.get(groupToken)!;
    totalStage1Meta.delay = totalStage1Meta.countdown > 0;
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
