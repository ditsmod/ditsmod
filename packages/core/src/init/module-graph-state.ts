import type { Provider } from '#di/top/types-and-models.js';
import type { ModRefId } from '#decorators/module-decorator-options.js';
import { isRootModule } from '#decorators/type-guards.js';
import type { NormalizedModuleMeta } from '#init/normalized-meta.js';

/**
 * Encapsulates the immutable snapshot state of the application module dependency graph (Memento pattern).
 * Provides atomic copying, deep metadata cloning, and state synchronization for transactional runtime modifications.
 */
export class ModuleGraphState {
  snapshotMap = new Map<ModRefId, NormalizedModuleMeta>();
  snapshotMapId = new Map<string, ModRefId>();
  childrenMap = new Map<ModRefId, Set<ModRefId>>();
  providersPerApp: Provider[] = [];

  /**
   * Creates an independent deep clone of the entire module graph state.
   */
  clone(): ModuleGraphState {
    const copy = new ModuleGraphState();
    this.snapshotMap.forEach((meta, key) => {
      copy.snapshotMap.set(key, meta.clone());
    });
    copy.snapshotMapId = new Map(this.snapshotMapId);
    this.childrenMap.forEach((children, key) => {
      copy.childrenMap.set(key, new Set(children));
    });
    copy.providersPerApp = this.providersPerApp.slice();
    return copy;
  }

  /**
   * Recomputes application-scoped providers (`providersPerApp`) across all active non-root feature modules in the snapshot.
   */
  rebuildProvidersPerApp(): void {
    this.providersPerApp = [];
    this.snapshotMap.forEach((meta) => {
      if (!isRootModule(meta)) {
        this.providersPerApp.push(...meta.providersPerApp);
      }
    });
  }

  /**
   * Safely removes an orphaned module and all its dependency graph relationships from the current state snapshot,
   * then recomputes the active application-scoped providers registry.
   */
  removeOrphanModule(modRefId: ModRefId, id?: string): void {
    const meta = this.snapshotMap.get(modRefId);
    const targetId = id || meta?.id;
    if (targetId) {
      this.snapshotMapId.delete(targetId);
    }
    this.snapshotMap.delete(modRefId);
    this.childrenMap.delete(modRefId);
    this.rebuildProvidersPerApp();
  }
}
