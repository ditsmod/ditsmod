import { Class, Injector, injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import {
  Extension,
  Stage1DebugMeta,
  Stage1ExtensionMeta,
  ExtensionCounters,
  Stage1ExtensionMeta2,
  ExtensionClass,
} from '#extension/extension-types.js';
import { ModRefId, OptionalProps } from '#types/mix.js';
import { Counter } from '#extension/counter.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { createDeferred } from '#utils/create-deferred.js';
import { BaseMeta } from '#types/base-meta.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { isExtensionProvider } from './type-guards.js';
import {
  notDeclaredInAfterExtensionList,
  detectedCircularDependenciesForExtensions,
  extensionIsFailed,
} from '#errors';

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
export type StageIterationMap = Map<ExtensionClass, StageIteration>;

@injectable()
export class ExtensionsManager {
  /**
   * Settings by BaseAppInitializer.
   */
  moduleName: string = '';
  /**
   * Settings by BaseAppInitializer.
   */
  protected stageIterationMap: StageIterationMap;
  protected currStageIteration: StageIteration;
  protected unfinishedInit = new Set<Extension | ExtensionClass>();
  /**
   * The cache for extension in the current module.
   */
  protected debugMetaCache = new Map<Extension, Stage1DebugMeta>();
  protected excludedExtensionPendingList = new Map<ExtensionClass, Set<Class<Extension>>>();
  protected extensionsListForStage2 = new Set<Extension>();
  /**
   * The cache for ExtCls in the current module.
   */
  protected stage1ExtensionMetaCache = new Map<ExtensionClass, Stage1ExtensionMeta>();

  constructor(
    protected injector: Injector,
    protected log: SystemLogMediator,
    protected counter: Counter,
    protected extensionsContext: ExtensionsContext,
    protected extensionCounters: ExtensionCounters,
  ) {}

  async stage1<T>(
    ExtCls: ExtensionClass<T>,
    pendingExtension?: Extension,
    parApp?: false,
  ): Promise<Stage1ExtensionMeta<T>>;
  async stage1<T>(
    ExtCls: ExtensionClass<T>,
    pendingExtension: Extension,
    parApp: true,
  ): Promise<Stage1ExtensionMeta2<T>>;
  async stage1<T>(
    ExtCls: ExtensionClass<T>,
    pendingExtension?: Extension,
    parApp?: boolean,
  ): Promise<Stage1ExtensionMeta<T>> {
    const currStageIteration = this.currStageIteration;
    const stageIteration = this.stageIterationMap.get(ExtCls);
    if (stageIteration) {
      if (stageIteration.index > currStageIteration.index) {
        const extensionName = this.getItemName([...this.unfinishedInit].at(-1)!) || 'unknown';
        throw notDeclaredInAfterExtensionList(extensionName, ExtCls.name);
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
      return this.updatePerAppState(ExtCls, stage1ExtensionMeta, pendingExtension, parApp);
    }

    stage1ExtensionMeta = await this.prepareAndInitExtension<T>(ExtCls);
    stage1ExtensionMeta.groupDataPerApp = this.extensionsContext.mStage1ExtensionMeta.get(ExtCls)!;
    stage1ExtensionMeta = this.updatePerAppState(ExtCls, stage1ExtensionMeta, pendingExtension, parApp);
    currStageIteration.resolve();
    return stage1ExtensionMeta;
  }

  protected updatePerAppState(
    ExtCls: ExtensionClass,
    stage1ExtensionMeta: Stage1ExtensionMeta,
    pendingExtension?: Extension,
    parApp?: boolean,
  ) {
    stage1ExtensionMeta = this.prepareStage1ExtensionMetaPerApp(stage1ExtensionMeta, parApp);
    if (parApp) {
      if (stage1ExtensionMeta.delay) {
        this.addExtensionToPendingList(ExtCls, pendingExtension!);
      } else {
        this.excludeExtensionFromPendingList(ExtCls, pendingExtension!);
      }
    }
    return stage1ExtensionMeta;
  }

  protected prepareStage1ExtensionMetaPerApp(
    stage1ExtensionMeta: Stage1ExtensionMeta2,
    parApp?: boolean,
  ): Stage1ExtensionMeta {
    if (parApp && !stage1ExtensionMeta.delay) {
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
  protected addExtensionToPendingList(ExtCls: ExtensionClass, pendingExtension: Extension) {
    const ExtensionClass = pendingExtension.constructor as Class<Extension>;
    const mExtensions =
      this.extensionsContext.mExtensionPendingList.get(ExtCls) || new Map<Class<Extension>, Extension>();

    if (!mExtensions.has(ExtensionClass)) {
      mExtensions.set(ExtensionClass, pendingExtension);
      this.extensionsContext.mExtensionPendingList.set(ExtCls, mExtensions);
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
    this.log.startExtensionsExtensionInit(this, this.unfinishedInit);
    const stage1ExtensionMeta = await this.initExtension(ExtCls);
    this.log.finishExtensionsExtensionInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(ExtCls);
    this.stage1ExtensionMetaCache.set(ExtCls, stage1ExtensionMeta);
    this.setStage1ExtensionMetaPerApp(ExtCls, stage1ExtensionMeta);
    return stage1ExtensionMeta;
  }

  protected setStage1ExtensionMetaPerApp(ExtCls: ExtensionClass, stage1ExtensionMeta: Stage1ExtensionMeta) {
    const copyStage1ExtensionMeta = { ...stage1ExtensionMeta } as Stage1ExtensionMeta;
    delete (copyStage1ExtensionMeta as OptionalProps<Stage1ExtensionMeta, 'groupDataPerApp'>).groupDataPerApp;
    const aStage1ExtensionMeta = this.extensionsContext.mStage1ExtensionMeta.get(ExtCls) || [];
    aStage1ExtensionMeta.push(copyStage1ExtensionMeta);
    this.extensionsContext.mStage1ExtensionMeta.set(ExtCls, aStage1ExtensionMeta);
  }

  protected async initExtension<T>(ExtCls: ExtensionClass): Promise<Stage1ExtensionMeta> {
    const extension = this.injector.get(ExtCls, undefined, []) as Extension<T>;
    const stage1ExtensionMeta = new Stage1ExtensionMeta<T>(this.moduleName, [], []);
    this.updateExtensionCounters(ExtCls, stage1ExtensionMeta);

    if (this.unfinishedInit.has(extension)) {
      this.throwCircularDeps(extension);
    }
    const debugMetaCache = this.debugMetaCache.get(extension);
    if (debugMetaCache) {
      stage1ExtensionMeta.addDebugMeta(debugMetaCache);
      return stage1ExtensionMeta;
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
    const debugMeta = new Stage1DebugMeta<T>(extension, data, !isLastModule, countdown);
    this.debugMetaCache.set(extension, debugMeta);
    stage1ExtensionMeta.addDebugMeta(debugMeta);

    return stage1ExtensionMeta;
  }

  protected updateExtensionCounters(ExtCls: ExtensionClass, stage1ExtensionMeta: Stage1ExtensionMeta) {
    stage1ExtensionMeta.countdown = this.extensionCounters.mExtensions.get(ExtCls)!;
    stage1ExtensionMeta.delay = stage1ExtensionMeta.countdown > 0;
  }

  protected throwCircularDeps(item: Extension | ExtensionClass) {
    const items = Array.from(this.unfinishedInit);
    const index = items.findIndex((ext) => ext === item);
    const prefixChain = items.slice(0, index);
    const circularChain = items.slice(index);
    const prefixNames = prefixChain.map(this.getItemName).join(' -> ');
    let circularNames = circularChain.map(this.getItemName).join(' -> ');
    circularNames += ` -> ${this.getItemName(item)}`;
    throw detectedCircularDependenciesForExtensions(prefixNames, circularNames);
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
export class InternalExtensionsManager extends ExtensionsManager {
  async internalStage1(baseMeta: BaseMeta, aOrderedExtensions: ExtensionClass[]) {
    this.moduleName = baseMeta.name;
    const stageIterationMap = new Map() as StageIterationMap;
    this.stageIterationMap = stageIterationMap;
    aOrderedExtensions.forEach((ExtCls, index) => {
      stageIterationMap.set(ExtCls, new StageIteration(index));
    });

    for (const [ExtCls, currStageIteration] of stageIterationMap) {
      try {
        this.currStageIteration = currStageIteration;
        await this.stage1(ExtCls);
        this.updateExtensionPendingList();
      } catch (err: any) {
        const moduleName = getDebugClassName(baseMeta.modRefId) || '""';
        throw extensionIsFailed(ExtCls.name, moduleName, err);
      }
    }
    this.setExtensionsToStage2(baseMeta.modRefId);
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
