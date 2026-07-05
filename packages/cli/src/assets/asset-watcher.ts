import chokidar, { type FSWatcher } from 'chokidar';
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';

export interface AssetEntry {
  /**
   * Glob pattern(s) relative to `srcRoot` to watch.
   * E.g. `"**\/*.json"` or `["**\/*.graphql", "**\/*.proto"]`.
   */
  include: string | string[];

  /**
   * Optional glob(s) to exclude.
   */
  exclude?: string | string[];
}

export interface AssetWatcherOptions {
  /**
   * The source root directory (e.g., `src`). Patterns are resolved relative to this.
   */
  srcRoot: string;

  /**
   * The output directory (e.g., `dist`). Files are mirrored here.
   */
  outDir: string;

  /**
   * List of asset entries to watch and copy.
   */
  assets: AssetEntry[];
}

/**
 * Watches non-TypeScript asset files and mirrors changes into the output
 * directory, replicating the same relative path structure.
 *
 * Emits:
 * - `change` (srcPath: string, destPath: string) — when an asset is copied/removed.
 * - `error` (err: Error)
 */
export class AssetWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private readonly srcRoot: string;
  private readonly outDir: string;

  constructor(private readonly options: AssetWatcherOptions) {
    super();
    this.srcRoot = path.resolve(options.srcRoot);
    this.outDir = path.resolve(options.outDir);
  }

  start(): void {
    // Chokidar v4 no longer resolves glob patterns passed to watch() reliably
    // on all platforms. Instead we watch the srcRoot directories directly and
    // use Node.js built-in path.matchesGlob() (available since Node 22) to
    // filter events according to the configured include/exclude patterns.
    const includeGlobs = this.options.assets.flatMap((entry) => {
      const includes = Array.isArray(entry.include) ? entry.include : [entry.include];
      return includes.map((g) => path.join(this.srcRoot, g));
    });

    const excludeGlobs = this.options.assets.flatMap((entry) => {
      const excludes = entry.exclude ? (Array.isArray(entry.exclude) ? entry.exclude : [entry.exclude]) : [];
      return excludes.map((g) => path.join(this.srcRoot, g));
    });

    /**
     * Returns true if `absPath` matches one of the include patterns AND does
     * not match any of the exclude patterns.
     */
    const isAsset = (absPath: string): boolean => {
      if (!includeGlobs.some((g) => path.matchesGlob(absPath, g))) return false;
      if (excludeGlobs.some((g) => path.matchesGlob(absPath, g))) return false;
      return true;
    };

    this.watcher = chokidar.watch(this.srcRoot, {
      persistent: true,
      ignoreInitial: false, // Copy existing assets on startup
    });

    this.watcher
      .on('add', (filePath: string) => { if (isAsset(filePath)) this.copyAsset(filePath); })
      .on('change', (filePath: string) => { if (isAsset(filePath)) this.copyAsset(filePath); })
      .on('unlink', (filePath: string) => { if (isAsset(filePath)) this.removeAsset(filePath); })
      .on('error', (err: unknown) => this.emit('error', err instanceof Error ? err : new Error(String(err))));
  }

  async close(): Promise<void> {
    await this.watcher?.close();
    this.watcher = null;
  }

  private copyAsset(srcPath: string): void {
    const destPath = this.resolveDestPath(srcPath);
    try {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      this.emit('change', srcPath, destPath);
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }

  private removeAsset(srcPath: string): void {
    const destPath = this.resolveDestPath(srcPath);
    try {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath);
        this.emit('change', srcPath, destPath);
      }
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }

  private resolveDestPath(srcPath: string): string {
    const relative = path.relative(this.srcRoot, srcPath);
    return path.join(this.outDir, relative);
  }
}
