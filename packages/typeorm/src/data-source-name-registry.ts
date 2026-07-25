/**
 * Tracks active data-source names at the process level to detect accidental
 * duplicate registrations early. Calling `TypeormModule.forRoot()` twice with
 * the same `name` would silently insert two placeholder providers under the same
 * token — only the first one would be updated by `TypeormExtension`, leaving a
 * stale `null` entry. This registry surfaces that mistake as a warning.
 *
 * Names are unregistered in `DataSourceManager.onShutdown()` so the registry
 * stays accurate across application restarts within the same process (e.g.
 * multiple test runs).
 */
export class DataSourceNameRegistry {
  private static readonly registeredNames = new Set<string>();

  static register(dataSourceName: string): void {
    if (this.registeredNames.has(dataSourceName)) {
      console.warn(
        `[TypeormModule] A DataSource with the name "${dataSourceName}" is already registered. ` +
          'Multiple DataSources must use unique names; otherwise they will override each other. ' +
          'Assign a unique "name" property to each TypeormModule.forRoot() call.',
      );
    }
    this.registeredNames.add(dataSourceName);
  }

  static unregister(dataSourceName: string): void {
    this.registeredNames.delete(dataSourceName);
  }

  static has(dataSourceName: string): boolean {
    return this.registeredNames.has(dataSourceName);
  }

  /** Clears all registered names. Primarily for use in tests. */
  static clear(): void {
    this.registeredNames.clear();
  }
}
