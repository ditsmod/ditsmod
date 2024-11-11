import { Class, BeforeToken, Injector, KeyRegistry, injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import {
  ExtensionsGroupToken,
  Extension,
  DebugStage1Meta,
  GroupStage1Meta,
  ExtensionCounters,
  GroupStage1Meta2,
} from '#types/extension-types.js';
import { ModRefId, OptionalProps } from '#types/mix.js';
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
   * The cache for groupToken in the current module.
   */
  protected groupStage1MetaCache = new Map<ExtensionsGroupToken, GroupStage1Meta>();
  /**
   * The cache for extension in the current module.
   */
  protected debugMetaCache = new Map<Extension, DebugStage1Meta>();
  protected excludedExtensionPendingList = new Map<ExtensionsGroupToken, Set<Class<Extension>>>();
  protected extensionsListForStage2 = new Set<Extension>();

  constructor(
    protected injector: Injector,
    protected systemLogMediator: SystemLogMediator,
    protected counter: Counter,
    protected extensionsContext: ExtensionsContext,
    protected extensionCounters: ExtensionCounters,
  ) {}

  async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: false): Promise<GroupStage1Meta<T>>;
  async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp: true): Promise<GroupStage1Meta2<T>>;
  async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: boolean): Promise<GroupStage1Meta<T>> {
    if (this.unfinishedInit.has(groupToken)) {
      this.throwCircularDeps(groupToken);
    }

    const beforeToken = KeyRegistry.getBeforeToken(groupToken);
    if (!this.groupStage1MetaCache.has(beforeToken) && this.beforeTokens.has(beforeToken)) {
      await this.prepareAndInitGroup<T>(beforeToken);
    }

    let groupStage1Meta = this.groupStage1MetaCache.get(groupToken);
    if (groupStage1Meta) {
      this.updateGroupCounters(groupToken, groupStage1Meta);
      groupStage1Meta = this.prepareGroupStage1MetaPerApp(groupStage1Meta, perApp);
      if (perApp && !groupStage1Meta.delay) {
        this.excludeExtensionFromPendingList(groupToken);
      }
      return groupStage1Meta;
    }

    groupStage1Meta = await this.prepareAndInitGroup<T>(groupToken);
    groupStage1Meta.groupDataPerApp = this.extensionsContext.mGroupStage1Meta.get(groupToken)!;
    groupStage1Meta = this.prepareGroupStage1MetaPerApp(groupStage1Meta, perApp);
    if (perApp) {
      if (groupStage1Meta.delay) {
        this.addExtensionToPendingList(groupToken);
      } else {
        this.excludeExtensionFromPendingList(groupToken);
      }
    }
    return groupStage1Meta;
  }

  updateExtensionPendingList() {
    for (const [groupToken, sExtensions] of this.excludedExtensionPendingList) {
      for (const ExtensionClass of sExtensions) {
        const mExtensions = this.extensionsContext.mExtensionPendingList.get(groupToken)!;
        mExtensions.delete(ExtensionClass);
      }
    }
  }

  setExtensionsToStage2(modRefId: ModRefId) {
    this.extensionsContext.mStage.set(modRefId, this.extensionsListForStage2);
  }

  protected prepareGroupStage1MetaPerApp(groupStage1Meta: GroupStage1Meta2, perApp?: boolean): GroupStage1Meta {
    if (perApp && !groupStage1Meta.delay) {
      const copygroupStage1Meta = { ...groupStage1Meta };
      delete (copygroupStage1Meta as GroupStage1Meta2).groupData;
      delete (copygroupStage1Meta as GroupStage1Meta2).groupDebugMeta;
      delete (copygroupStage1Meta as GroupStage1Meta2).moduleName;
      delete (copygroupStage1Meta as GroupStage1Meta2).countdown;
      return copygroupStage1Meta as GroupStage1Meta;
    }
    return groupStage1Meta as GroupStage1Meta;
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
    const groupStage1Meta = await this.initGroup(groupToken);
    this.systemLogMediator.finishExtensionsGroupInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(groupToken);
    this.groupStage1MetaCache.set(groupToken, groupStage1Meta);
    this.setGroupStage1MetaPerApp(groupToken, groupStage1Meta);
    return groupStage1Meta;
  }

  protected setGroupStage1MetaPerApp(groupToken: ExtensionsGroupToken, groupStage1Meta: GroupStage1Meta) {
    const copyGroupStage1Meta = { ...groupStage1Meta } as GroupStage1Meta;
    delete (copyGroupStage1Meta as OptionalProps<GroupStage1Meta, 'groupDataPerApp'>).groupDataPerApp;
    const aGroupStage1Meta = this.extensionsContext.mGroupStage1Meta.get(groupToken) || [];
    aGroupStage1Meta.push(copyGroupStage1Meta);
    this.extensionsContext.mGroupStage1Meta.set(groupToken, aGroupStage1Meta);
  }

  protected async initGroup<T>(groupToken: ExtensionsGroupToken): Promise<GroupStage1Meta> {
    const extensions = this.injector.get(groupToken, undefined, []) as Extension<T>[];
    const groupStage1Meta = new GroupStage1Meta<T>(this.moduleName, [], []);
    this.updateGroupCounters(groupToken, groupStage1Meta);

    if (!extensions.length) {
      this.systemLogMediator.noExtensionsFound(this, groupToken, this.unfinishedInit);
    }

    for (const extension of extensions) {
      if (this.unfinishedInit.has(extension)) {
        this.throwCircularDeps(extension);
      }
      const debugMetaCache = this.debugMetaCache.get(extension);
      if (debugMetaCache) {
        groupStage1Meta.addDebugMeta(debugMetaCache);
        continue;
      }

      this.unfinishedInit.add(extension);
      this.systemLogMediator.startInitExtension(this, this.unfinishedInit);
      const ExtensionClass = extension.constructor as Class<Extension<T>>;
      const countdown = this.extensionCounters.mExtensions.get(ExtensionClass) || 0;
      const isLastModule = countdown === 0;
      const data = (await extension.stage1?.(isLastModule)) as T;
      this.extensionsListForStage2.add(extension);
      this.systemLogMediator.finishInitExtension(this, this.unfinishedInit, data);
      this.counter.addInitedExtensions(extension);
      this.unfinishedInit.delete(extension);
      const debugMeta = new DebugStage1Meta<T>(extension, data, !isLastModule, countdown);
      this.debugMetaCache.set(extension, debugMeta);
      groupStage1Meta.addDebugMeta(debugMeta);
    }

    return groupStage1Meta;
  }

  protected updateGroupCounters(groupToken: ExtensionsGroupToken, groupStage1Meta: GroupStage1Meta) {
    groupStage1Meta.countdown = this.extensionCounters.mGroupTokens.get(groupToken)!;
    groupStage1Meta.delay = groupStage1Meta.countdown > 0;
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
