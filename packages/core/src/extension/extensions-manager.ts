import { ChainError } from '@ts-stack/chain-error';

import { Class, Injector, injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import {
  Extension,
  Stage1DebugMeta,
  Stage1ExtensionMeta,
  ExtensionCounters,
  Stage1ExtensionMeta2,
  ExtensionType,
} from '#extension/extension-types.js';
import { ModRefId, OptionalProps } from '#types/mix.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { isInjectionToken } from '#di';
import { Counter } from '#extension/counter.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { createDeferred } from '#utils/create-deferred.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';

export class StageIteration {
  promise: Promise<void>;
  resolve: () => void;
  reject: (err: any) => void;

  constructor(public index: number) {
    const obj = createDeferred<void>();
    this.promise = obj.promise;
    this.resolve = obj.resolve;
    this.reject = obj.reject;
  }
}
export type StageIterationMap = Map<ExtensionType, StageIteration>;

@injectable()
export class ExtensionsManager {
  /**
   * Settings by AppInitializer.
   */
  moduleName: string = '';
  /**
   * Settings by AppInitializer.
   */
  protected stageIterationMap: StageIterationMap;
  protected currStageIteration: StageIteration;
  protected unfinishedInit = new Set<Extension | ExtensionType>();
  /**
   * The cache for extension in the current module.
   */
  protected debugMetaCache = new Map<Extension, Stage1DebugMeta>();
  protected excludedExtensionPendingList = new Map<ExtensionType, Set<Class<Extension>>>();
  protected extensionsListForStage2 = new Set<Extension>();
  /**
   * The cache for ExtCls in the current module.
   */
  protected stage1ExtensionMetaCache = new Map<ExtensionType, Stage1ExtensionMeta>();

  constructor(
    protected injector: Injector,
    protected systemLogMediator: SystemLogMediator,
    protected counter: Counter,
    protected extensionsContext: ExtensionsContext,
    protected extensionCounters: ExtensionCounters,
  ) {}

  async stage1<T>(ExtCls: ExtensionType<T>): Promise<Stage1ExtensionMeta<T>>;
  async stage1<T>(ExtCls: ExtensionType<T>, pendingExtension: Extension): Promise<Stage1ExtensionMeta2<T>>;
  async stage1<T>(ExtCls: ExtensionType<T>, pendingExtension?: Extension): Promise<Stage1ExtensionMeta<T>> {
    const currStageIteration = this.currStageIteration;
    const stageIteration = this.stageIterationMap.get(ExtCls);
    if (stageIteration) {
      if (stageIteration.index > currStageIteration.index) {
        const extensionName = this.getItemName([...this.unfinishedInit].at(-1)!);
        this.systemLogMediator.throwEarlyExtensionCalling(`${ExtCls}`, extensionName);
      } else if (this.unfinishedInit.has(ExtCls)) {
        await stageIteration.promise;
      }
    }
    if (this.unfinishedInit.has(ExtCls)) {
      this.throwCircularDeps(ExtCls);
    }

    let stage1ExtensionMeta = this.stage1ExtensionMetaCache.get(ExtCls);
    if (stage1ExtensionMeta) {
      this.updateExtensionCounters(ExtCls, stage1ExtensionMeta);
      return this.updatePerAppState(ExtCls, stage1ExtensionMeta, pendingExtension);
    }

    stage1ExtensionMeta = await this.prepareAndInitExtension<T>(ExtCls);
    stage1ExtensionMeta.groupDataPerApp = this.extensionsContext.mStage1ExtensionMeta.get(ExtCls)!;
    stage1ExtensionMeta = this.updatePerAppState(ExtCls, stage1ExtensionMeta, pendingExtension);
    currStageIteration.resolve();
    return stage1ExtensionMeta;
  }

  protected updatePerAppState(
    ExtCls: ExtensionType,
    stage1ExtensionMeta: Stage1ExtensionMeta,
    pendingExtension?: Extension,
  ) {
    stage1ExtensionMeta = this.prepareStage1ExtensionMetaPerApp(stage1ExtensionMeta, pendingExtension);
    if (pendingExtension) {
      if (stage1ExtensionMeta.delay) {
        this.addExtensionToPendingList(ExtCls, pendingExtension);
      } else {
        this.excludeExtensionFromPendingList(ExtCls, pendingExtension);
      }
    }
    return stage1ExtensionMeta;
  }

  protected prepareStage1ExtensionMetaPerApp(
    stage1ExtensionMeta: Stage1ExtensionMeta2,
    pendingExtension?: Extension,
  ): Stage1ExtensionMeta {
    if (pendingExtension && !stage1ExtensionMeta.delay) {
      const copystage1ExtensionMeta = { ...stage1ExtensionMeta };
      delete (copystage1ExtensionMeta as Stage1ExtensionMeta2).groupData;
      delete (copystage1ExtensionMeta as Stage1ExtensionMeta2).groupDebugMeta;
      delete (copystage1ExtensionMeta as Stage1ExtensionMeta2).moduleName;
      delete (copystage1ExtensionMeta as Stage1ExtensionMeta2).countdown;
      return copystage1ExtensionMeta as Stage1ExtensionMeta;
    }
    return stage1ExtensionMeta as Stage1ExtensionMeta;
  }

  /**
   * Adds to the pending list of extensions that want to receive the initialization
   * result of `ExtCls` from the whole application.
   */
  protected addExtensionToPendingList(ExtCls: ExtensionType, pendingExtension: Extension) {
    const ExtensionClass = pendingExtension.constructor as Class<Extension>;
    const mExtensions =
      this.extensionsContext.mExtensionPendingList.get(ExtCls) || new Map<Class<Extension>, Extension>();

    if (!mExtensions.has(ExtensionClass)) {
      mExtensions.set(ExtensionClass, pendingExtension);
      this.extensionsContext.mExtensionPendingList.set(ExtCls, mExtensions);
    }
  }

  protected excludeExtensionFromPendingList(ExtCls: ExtensionType, pendingExtension: Extension) {
    const ExtensionClass = pendingExtension.constructor as Class<Extension>;
    const excludedExtensions = this.excludedExtensionPendingList.get(ExtCls) || new Set<Class<Extension>>();
    excludedExtensions.add(ExtensionClass);
    this.excludedExtensionPendingList.set(ExtCls, excludedExtensions);
  }

  protected async prepareAndInitExtension<T>(ExtCls: ExtensionType<T>) {
    this.unfinishedInit.add(ExtCls);
    this.systemLogMediator.startExtensionsExtensionInit(this, this.unfinishedInit);
    const stage1ExtensionMeta = await this.initExtension(ExtCls);
    this.systemLogMediator.finishExtensionsExtensionInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(ExtCls);
    this.stage1ExtensionMetaCache.set(ExtCls, stage1ExtensionMeta);
    this.setStage1ExtensionMetaPerApp(ExtCls, stage1ExtensionMeta);
    return stage1ExtensionMeta;
  }

  protected setStage1ExtensionMetaPerApp(ExtCls: ExtensionType, stage1ExtensionMeta: Stage1ExtensionMeta) {
    const copyStage1ExtensionMeta = { ...stage1ExtensionMeta } as Stage1ExtensionMeta;
    delete (copyStage1ExtensionMeta as OptionalProps<Stage1ExtensionMeta, 'groupDataPerApp'>).groupDataPerApp;
    const aStage1ExtensionMeta = this.extensionsContext.mStage1ExtensionMeta.get(ExtCls) || [];
    aStage1ExtensionMeta.push(copyStage1ExtensionMeta);
    this.extensionsContext.mStage1ExtensionMeta.set(ExtCls, aStage1ExtensionMeta);
  }

  protected async initExtension<T>(ExtCls: ExtensionType): Promise<Stage1ExtensionMeta> {
    const extensions = this.injector.get(ExtCls, undefined, []) as Extension<T>[];
    const stage1ExtensionMeta = new Stage1ExtensionMeta<T>(this.moduleName, [], []);
    this.updateExtensionCounters(ExtCls, stage1ExtensionMeta);

    if (!extensions.length) {
      this.systemLogMediator.noExtensionsFound(this, ExtCls, this.unfinishedInit);
    }

    for (const extension of extensions) {
      if (this.unfinishedInit.has(extension)) {
        this.throwCircularDeps(extension);
      }
      const debugMetaCache = this.debugMetaCache.get(extension);
      if (debugMetaCache) {
        stage1ExtensionMeta.addDebugMeta(debugMetaCache);
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
      const debugMeta = new Stage1DebugMeta<T>(extension, data, !isLastModule, countdown);
      this.debugMetaCache.set(extension, debugMeta);
      stage1ExtensionMeta.addDebugMeta(debugMeta);
    }

    return stage1ExtensionMeta;
  }

  protected updateExtensionCounters(ExtCls: ExtensionType, stage1ExtensionMeta: Stage1ExtensionMeta) {
    // stage1ExtensionMeta.countdown = this.extensionCounters.mExtensionTokens.get(ExtCls)!;
    stage1ExtensionMeta.delay = stage1ExtensionMeta.countdown > 0;
  }

  protected throwCircularDeps(item: Extension | ExtensionType) {
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

  protected getItemName(tokenOrExtension: Extension | ExtensionType) {
    if (isInjectionToken(tokenOrExtension) || typeof tokenOrExtension == 'string') {
      return getProviderName(tokenOrExtension);
    } else {
      return tokenOrExtension.constructor.name;
    }
  }
}

@injectable()
export class InternalExtensionsManager extends ExtensionsManager {
  async internalStage1(meta: NormalizedModuleMetadata) {
    this.moduleName = meta.name;
    const stageIterationMap = new Map() as StageIterationMap;
    this.stageIterationMap = stageIterationMap;
    meta.aOrderedExtensions.forEach((ExtCls, index) => {
      stageIterationMap.set(ExtCls, new StageIteration(index));
    });

    for (const [ExtCls, currStageIteration] of stageIterationMap) {
      try {
        this.currStageIteration = currStageIteration;
        await this.stage1(ExtCls);
        this.updateExtensionPendingList();
      } catch (err: any) {
        const debugModuleName = getDebugClassName(meta.modRefId);
        const msg = `${ExtCls} group in ${debugModuleName} failed`;
        throw new ChainError(msg, { cause: err, name: 'Error' });
      }
    }
    this.setExtensionsToStage2(meta.modRefId);
  }

  protected setExtensionsToStage2(modRefId: ModRefId) {
    this.extensionsContext.mStage.set(modRefId, this.extensionsListForStage2);
  }

  protected updateExtensionPendingList() {
    for (const [ExtCls, sExtensions] of this.excludedExtensionPendingList) {
      for (const ExtensionClass of sExtensions) {
        const mExtensions = this.extensionsContext.mExtensionPendingList.get(ExtCls);
        mExtensions?.delete(ExtensionClass);
        if (!mExtensions?.size) {
          this.extensionsContext.mExtensionPendingList.delete(ExtCls);
        }
      }
    }
  }
}
