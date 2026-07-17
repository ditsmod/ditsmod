import { SystemLogMediator } from '#logger/system-log-mediator.js';
import {
  Extension,
  ExtensionDebugMeta,
  ExtensionGroupMeta,
  ExtensionCounters,
  PartialExtensionGroupMeta,
  ExtensionClass,
} from '#extension/extension-types.js';
import { ModRefId, OptionalProps } from '#types/mix.js';
import { ExtensionStatistics } from '#extension/counter.js';
import { ExtensionContext } from '#extension/extensions-context.js';
import { NormalizedModuleMeta } from '#init/normalized-meta.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { isExtensionProvider } from './type-guards.js';
import { UndeclaredExtensionDependency, CyclicExtensions, ExtensionExecutionFailure } from '#errors';
import { injectable } from '#di/decorators.js';
import { Injector } from '#di/injector.js';
import type { Class, TokenProvider } from '#di/top/types-and-models.js';

export class StageEntry {
  promise: Promise<void>;
  resolve: () => void;
  reject: (err: any) => void;

  constructor(public index: number) {
    const obj = Promise.withResolvers<void>();
    this.promise = obj.promise;
    this.resolve = obj.resolve;
    this.reject = obj.reject;
  }
}
export type StageEntryMap = Map<ExtensionClass, StageEntry>;

@injectable()
export class ExtensionManager {
  /**
   * Settings by {@link InternalExtensionManager}.
   */
  moduleName: string = '';
  protected normalizedModuleMeta: NormalizedModuleMeta;
  /**
   * Settings by {@link InternalExtensionManager}.
   */
  protected stageIterationMap: StageEntryMap;
  protected currStageEntry: StageEntry;
  protected unfinishedInit = new Set<Extension | ExtensionClass>();
  /**
   * The cache for `extension.stage1()` in the current module.
   */
  protected debugMetaCache = new Map<Extension, ExtensionDebugMeta>();
  protected excludedExtensionPendingList = new Map<ExtensionClass, Set<Class<Extension>>>();
  protected extensionsListForStage2 = new Set<Extension>();
  /**
   * The cache for {@link ExtensionClass} in the current module.
   */
  protected extensionGroupMetaCache = new Map<ExtensionClass, ExtensionGroupMeta>();

  constructor(
    protected injector: Injector,
    protected log: SystemLogMediator,
    protected counter: ExtensionStatistics,
    protected extensionContext: ExtensionContext,
    protected extensionCounters: ExtensionCounters,
  ) {}

  async stage1<T>(ExtCls: ExtensionClass<T>): Promise<ExtensionGroupMeta<T>>;
  async stage1<T>(ExtCls: ExtensionClass<T>, pendingExtension: Extension): Promise<PartialExtensionGroupMeta<T>>;
  async stage1<T>(ExtCls: ExtensionClass<T>, pendingExtension?: Extension): Promise<ExtensionGroupMeta<T>> {
    const currStageEntry = this.currStageEntry;
    const stageIteration = this.stageIterationMap.get(ExtCls);
    if (stageIteration) {
      if (stageIteration.index > currStageEntry.index) {
        const extensionName = this.getItemName([...this.unfinishedInit].at(-1)!) || 'unknown';
        throw new UndeclaredExtensionDependency(extensionName, ExtCls.name);
      } else if (this.unfinishedInit.has(ExtCls)) {
        await stageIteration.promise;
      }
    }
    if (this.unfinishedInit.has(ExtCls)) {
      this.throwCircularDeps(ExtCls);
    }

    let extensionGroupMeta = this.extensionGroupMetaCache.get(ExtCls);
    if (extensionGroupMeta) {
      this.updateExtensionCounters(ExtCls, extensionGroupMeta);
      return this.updatePerAppState(ExtCls, extensionGroupMeta, pendingExtension);
    }

    extensionGroupMeta = await this.prepareAndInitExtension<T>(ExtCls);
    extensionGroupMeta.groupDataPerApp = this.extensionContext.mExtensionGroupMeta.get(ExtCls)!;
    extensionGroupMeta = this.updatePerAppState(ExtCls, extensionGroupMeta, pendingExtension);
    currStageEntry.resolve();
    return extensionGroupMeta;
  }

  protected updatePerAppState(
    ExtCls: ExtensionClass,
    extensionGroupMeta: ExtensionGroupMeta,
    pendingExtension?: Extension,
  ) {
    const perApp = Boolean(pendingExtension);
    extensionGroupMeta = this.prepareAppExtensionGroupMeta(extensionGroupMeta, perApp);
    if (perApp) {
      if (extensionGroupMeta.delay) {
        this.addExtensionToPendingList(ExtCls, pendingExtension!);
      } else {
        this.excludeExtensionFromPendingList(ExtCls, pendingExtension!);
      }
    }
    return extensionGroupMeta;
  }

  protected prepareAppExtensionGroupMeta(
    extensionGroupMeta: PartialExtensionGroupMeta,
    perApp?: boolean,
  ): ExtensionGroupMeta {
    if (perApp && !extensionGroupMeta.delay) {
      const copyextensionGroupMeta = { ...extensionGroupMeta };
      delete (copyextensionGroupMeta as PartialExtensionGroupMeta).groupData;
      delete (copyextensionGroupMeta as PartialExtensionGroupMeta).groupDebugMeta;
      delete (copyextensionGroupMeta as PartialExtensionGroupMeta).moduleName;
      delete (copyextensionGroupMeta as PartialExtensionGroupMeta).countdown;
      return copyextensionGroupMeta as ExtensionGroupMeta;
    }
    return extensionGroupMeta as ExtensionGroupMeta;
  }

  /**
   * Adds to the pending list of extensions that want to receive the initialization
   * result of `ExtCls` from the whole application.
   */
  protected addExtensionToPendingList(ExtCls: ExtensionClass, pendingExtension: Extension) {
    const ExtensionClass = pendingExtension.constructor as Class<Extension>;
    const mExtensions =
      this.extensionContext.mExtensionPendingList.get(ExtCls) || new Map<Class<Extension>, Extension>();

    if (!mExtensions.has(ExtensionClass)) {
      mExtensions.set(ExtensionClass, pendingExtension);
      this.extensionContext.mExtensionPendingList.set(ExtCls, mExtensions);
    }
  }

  protected excludeExtensionFromPendingList(ExtCls: ExtensionClass, pendingExtension: Extension) {
    const ExtensionClass = pendingExtension.constructor as Class<Extension>;
    const excludedExtensions = this.excludedExtensionPendingList.get(ExtCls) || new Set<Class<Extension>>();
    excludedExtensions.add(ExtensionClass);
    this.excludedExtensionPendingList.set(ExtCls, excludedExtensions);
  }

  protected async prepareAndInitExtension<T>(ExtCls: ExtensionClass<T>) {
    this.unfinishedInit.add(ExtCls);
    this.log.startExtensionInit(this, this.unfinishedInit);
    const extensionGroupMeta = await this.initExtension(ExtCls);
    this.log.finishExtensionInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(ExtCls);
    this.extensionGroupMetaCache.set(ExtCls, extensionGroupMeta);
    this.setAppExtensionGroupMeta(ExtCls, extensionGroupMeta);
    return extensionGroupMeta;
  }

  protected async initExtension<T>(ExtCls: ExtensionClass): Promise<ExtensionGroupMeta> {
    let extensions: Extension<T>[];
    const groupToken = this.normalizedModuleMeta.mExtensionAsGroupToken.get(ExtCls);
    if (groupToken) {
      extensions = this.injector.getOrderedMultiValues<TokenProvider>(
        groupToken,
        (a, b) => {
          const stageIterationA = this.stageIterationMap.get(a.useToken) || { index: 0 };
          const stageIterationB = this.stageIterationMap.get(b.useToken) || { index: 0 };
          return stageIterationA.index - stageIterationB.index;
        },
        [],
      );
    } else {
      const result = this.injector.get(ExtCls, false);
      extensions = result ? [result] : [];
    }
    const extensionGroupMeta = new ExtensionGroupMeta<T>(this.moduleName, [], []);
    this.updateExtensionCounters(ExtCls, extensionGroupMeta);

    for (const extension of extensions) {
      if (this.unfinishedInit.has(extension)) {
        this.throwCircularDeps(extension);
      }
      const debugMetaCache = this.debugMetaCache.get(extension);
      if (debugMetaCache) {
        extensionGroupMeta.addDebugMeta(debugMetaCache);
        continue;
      }

      this.unfinishedInit.add(extension);
      this.log.startInitExtension(this, this.unfinishedInit);
      const ExtensionClass = extension.constructor as Class<Extension<T>>;
      const countdown = this.extensionCounters.mExtensions.get(ExtensionClass) || 0;
      const isLastModule = countdown === 0;
      const data = (await extension.stage1?.(isLastModule)) as T;
      this.extensionsListForStage2.add(extension);
      this.log.finishInitExtension(this, this.unfinishedInit, data);
      this.counter.addInitedExtensions(extension);
      this.unfinishedInit.delete(extension);
      const debugMeta = new ExtensionDebugMeta<T>(extension, data, !isLastModule, countdown);
      this.debugMetaCache.set(extension, debugMeta);
      extensionGroupMeta.addDebugMeta(debugMeta);
    }
    return extensionGroupMeta;
  }

  protected setAppExtensionGroupMeta(ExtCls: ExtensionClass, extensionGroupMeta: ExtensionGroupMeta) {
    const copyExtensionGroupMeta = { ...extensionGroupMeta } as ExtensionGroupMeta;
    delete (copyExtensionGroupMeta as OptionalProps<ExtensionGroupMeta, 'groupDataPerApp'>).groupDataPerApp;
    const aExtensionGroupMeta = this.extensionContext.mExtensionGroupMeta.get(ExtCls) || [];
    aExtensionGroupMeta.push(copyExtensionGroupMeta);
    this.extensionContext.mExtensionGroupMeta.set(ExtCls, aExtensionGroupMeta);
  }

  protected updateExtensionCounters(ExtCls: ExtensionClass, extensionGroupMeta: ExtensionGroupMeta) {
    extensionGroupMeta.countdown = this.extensionCounters.mExtensions.get(ExtCls)!;
    extensionGroupMeta.delay = extensionGroupMeta.countdown > 0;
  }

  protected throwCircularDeps(item: Extension | ExtensionClass) {
    const items = Array.from(this.unfinishedInit);
    const index = items.findIndex((ext) => ext === item);
    const prefixChain = items.slice(0, index);
    const circularChain = items.slice(index);
    const prefixNames = prefixChain.map(this.getItemName).join(' -> ');
    let circularNames = circularChain.map(this.getItemName).join(' -> ');
    circularNames += ` -> ${this.getItemName(item)}`;
    throw new CyclicExtensions(circularNames, prefixNames);
  }

  protected getItemName(classOrInstance: Extension | ExtensionClass) {
    if (isExtensionProvider(classOrInstance)) {
      return `[group of ${getDebugClassName(classOrInstance)}]`;
    } else {
      return classOrInstance.constructor.name;
    }
  }
}

@injectable()
export class InternalExtensionManager extends ExtensionManager {
  async internalStage1(normalizedModuleMeta: NormalizedModuleMeta, aOrderedExtensions: ExtensionClass[]) {
    this.normalizedModuleMeta = normalizedModuleMeta;
    this.moduleName = normalizedModuleMeta.name;
    const stageIterationMap = new Map() as StageEntryMap;
    this.stageIterationMap = stageIterationMap;
    aOrderedExtensions.forEach((ExtCls, index) => {
      stageIterationMap.set(ExtCls, new StageEntry(index));
    });

    for (const [ExtCls, currStageEntry] of stageIterationMap) {
      try {
        this.currStageEntry = currStageEntry;
        await this.stage1(ExtCls);
        this.updateExtensionPendingList();
      } catch (err: any) {
        const moduleName = getDebugClassName(normalizedModuleMeta.modRefId) || '""';
        throw new ExtensionExecutionFailure(ExtCls.name, moduleName, err);
      }
    }
    this.setExtensionsToStage2(normalizedModuleMeta.modRefId);
  }

  protected setExtensionsToStage2(modRefId: ModRefId) {
    this.extensionContext.mStage.set(modRefId, this.extensionsListForStage2);
  }

  protected updateExtensionPendingList() {
    for (const [ExtCls, sExtensions] of this.excludedExtensionPendingList) {
      for (const ExtensionClass of sExtensions) {
        const mExtensions = this.extensionContext.mExtensionPendingList.get(ExtCls);
        mExtensions?.delete(ExtensionClass);
        if (!mExtensions?.size) {
          this.extensionContext.mExtensionPendingList.delete(ExtCls);
        }
      }
    }
  }
}
