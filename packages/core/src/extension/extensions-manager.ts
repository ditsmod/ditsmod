import { Class, Injector, injectable } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import {
  ExtensionsGroupToken,
  Extension,
  Stage1DebugMeta,
  Stage1GroupMeta,
  ExtensionCounters,
  Stage1GroupMeta2,
} from '#extension/extension-types.js';
import { ModRefId, OptionalProps } from '#types/mix.js';
import { getProviderName } from '#utils/get-provider-name.js';
import { isInjectionToken } from '#di';
import { Counter } from '#extension/counter.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { createDeferred } from '#utils/create-deferred.js';

export class StageIteration {
  promise: Promise<Stage1GroupMeta>;
  resolve: (stage1GroupMeta: Stage1GroupMeta) => void;
  reject: (err: any) => void;

  constructor(public index: number) {
    const obj = createDeferred<Stage1GroupMeta>();
    this.promise = obj.promise;
    this.resolve = obj.resolve;
    this.reject = obj.reject;
  }
}
export type StageIterationMap = Map<ExtensionsGroupToken, StageIteration>;

@injectable()
export class ExtensionsManager {
  /**
   * Settings by AppInitializer.
   */
  moduleName: string = '';
  /**
   * Settings by AppInitializer.
   */
  stageIterationMap: StageIterationMap;
  currStageIteration: StageIteration;
  unfinishedInit = new Set<Extension | ExtensionsGroupToken>();
  /**
   * The cache for groupToken in the current module.
   */
  protected stage1GroupMetaCache = new Map<ExtensionsGroupToken, Stage1GroupMeta>();
  /**
   * The cache for extension in the current module.
   */
  protected debugMetaCache = new Map<Extension, Stage1DebugMeta>();
  protected excludedExtensionPendingList = new Map<ExtensionsGroupToken, Set<Class<Extension>>>();
  protected extensionsListForStage2 = new Set<Extension>();

  constructor(
    protected injector: Injector,
    protected systemLogMediator: SystemLogMediator,
    protected counter: Counter,
    protected extensionsContext: ExtensionsContext,
    protected extensionCounters: ExtensionCounters,
  ) {}

  async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: false): Promise<Stage1GroupMeta<T>>;
  async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp: true): Promise<Stage1GroupMeta2<T>>;
  async stage1<T>(groupToken: ExtensionsGroupToken<T>, perApp?: boolean): Promise<Stage1GroupMeta<T>> {
    const currStageIteration = this.currStageIteration;

    const stageIteration = this.stageIterationMap.get(groupToken);
    if (stageIteration && (stageIteration.index > currStageIteration.index || this.unfinishedInit.has(groupToken))) {
      return stageIteration.promise;
    }
    if (this.unfinishedInit.has(groupToken)) {
      this.throwCircularDeps(groupToken);
    }
    this.unfinishedInit.add(groupToken);

    let stage1GroupMeta = this.stage1GroupMetaCache.get(groupToken);
    if (stage1GroupMeta) {
      this.updateGroupCounters(groupToken, stage1GroupMeta);
      stage1GroupMeta = this.prepareStage1GroupMetaPerApp(stage1GroupMeta, perApp);
      if (perApp && !stage1GroupMeta.delay) {
        this.excludeExtensionFromPendingList(groupToken);
      }
      return stage1GroupMeta;
    }

    stage1GroupMeta = await this.prepareAndInitGroup<T>(groupToken);
    stage1GroupMeta.groupDataPerApp = this.extensionsContext.mStage1GroupMeta.get(groupToken)!;
    stage1GroupMeta = this.prepareStage1GroupMetaPerApp(stage1GroupMeta, perApp);
    if (perApp) {
      if (stage1GroupMeta.delay) {
        this.addExtensionToPendingList(groupToken);
      } else {
        this.excludeExtensionFromPendingList(groupToken);
      }
    }
    currStageIteration.resolve(stage1GroupMeta);
    return stage1GroupMeta;
  }

  updateExtensionPendingList() {
    for (const [groupToken, sExtensions] of this.excludedExtensionPendingList) {
      for (const ExtensionClass of sExtensions) {
        const mExtensions = this.extensionsContext.mExtensionPendingList.get(groupToken);
        mExtensions?.delete(ExtensionClass);
      }
    }
  }

  setExtensionsToStage2(modRefId: ModRefId) {
    this.extensionsContext.mStage.set(modRefId, this.extensionsListForStage2);
  }

  protected prepareStage1GroupMetaPerApp(stage1GroupMeta: Stage1GroupMeta2, perApp?: boolean): Stage1GroupMeta {
    if (perApp && !stage1GroupMeta.delay) {
      const copystage1GroupMeta = { ...stage1GroupMeta };
      delete (copystage1GroupMeta as Stage1GroupMeta2).groupData;
      delete (copystage1GroupMeta as Stage1GroupMeta2).groupDebugMeta;
      delete (copystage1GroupMeta as Stage1GroupMeta2).moduleName;
      delete (copystage1GroupMeta as Stage1GroupMeta2).countdown;
      return copystage1GroupMeta as Stage1GroupMeta;
    }
    return stage1GroupMeta as Stage1GroupMeta;
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
    const stage1GroupMeta = await this.initGroup(groupToken);
    this.systemLogMediator.finishExtensionsGroupInit(this, this.unfinishedInit);
    this.unfinishedInit.delete(groupToken);
    this.stage1GroupMetaCache.set(groupToken, stage1GroupMeta);
    this.setStage1GroupMetaPerApp(groupToken, stage1GroupMeta);
    return stage1GroupMeta;
  }

  protected setStage1GroupMetaPerApp(groupToken: ExtensionsGroupToken, stage1GroupMeta: Stage1GroupMeta) {
    const copyStage1GroupMeta = { ...stage1GroupMeta } as Stage1GroupMeta;
    delete (copyStage1GroupMeta as OptionalProps<Stage1GroupMeta, 'groupDataPerApp'>).groupDataPerApp;
    const aStage1GroupMeta = this.extensionsContext.mStage1GroupMeta.get(groupToken) || [];
    aStage1GroupMeta.push(copyStage1GroupMeta);
    this.extensionsContext.mStage1GroupMeta.set(groupToken, aStage1GroupMeta);
  }

  protected async initGroup<T>(groupToken: ExtensionsGroupToken): Promise<Stage1GroupMeta> {
    const extensions = this.injector.get(groupToken, undefined, []) as Extension<T>[];
    const stage1GroupMeta = new Stage1GroupMeta<T>(this.moduleName, [], []);
    this.updateGroupCounters(groupToken, stage1GroupMeta);

    if (!extensions.length) {
      this.systemLogMediator.noExtensionsFound(this, groupToken, this.unfinishedInit);
    }

    for (const extension of extensions) {
      if (this.unfinishedInit.has(extension)) {
        this.throwCircularDeps(extension);
      }
      const debugMetaCache = this.debugMetaCache.get(extension);
      if (debugMetaCache) {
        stage1GroupMeta.addDebugMeta(debugMetaCache);
        continue;
      }

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
      stage1GroupMeta.addDebugMeta(debugMeta);
    }

    return stage1GroupMeta;
  }

  protected updateGroupCounters(groupToken: ExtensionsGroupToken, stage1GroupMeta: Stage1GroupMeta) {
    stage1GroupMeta.countdown = this.extensionCounters.mGroupTokens.get(groupToken)!;
    stage1GroupMeta.delay = stage1GroupMeta.countdown > 0;
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
