import { AssetWatcher } from './asset-watcher.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Create a real temporary sandbox for each test.
function makeTmpDirs(): { srcRoot: string; outDir: string; cleanup: () => void } {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'aw-spec-'));
  const srcRoot = path.join(base, 'src');
  const outDir = path.join(base, 'dist');
  fs.mkdirSync(srcRoot, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });
  return {
    srcRoot,
    outDir,
    cleanup: () => fs.rmSync(base, { recursive: true, force: true }),
  };
}

// Wait for chokidar's 'ready' event before doing file operations.
function waitReady(watcher: AssetWatcher): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // AssetWatcher wraps FSWatcher — access it through the internal field.
    // We listen to 'ready' on the underlying FSWatcher via chokidar.
    // Since chokidar's watcher is private, we use a small timeout after start()
    // that is consistent with chokidar's stabilization time.
    setTimeout(resolve, 500);
  });
}

describe('AssetWatcher', () => {
  let watcher: AssetWatcher;
  let cleanup: () => void;

  afterEach(async () => {
    if (watcher) {
      await watcher.close();
    }
    cleanup?.();
  });

  // ── Construction ──────────────────────────────────────────────────────────

  it('should instantiate with srcRoot, outDir, and assets options', () => {
    const { srcRoot, outDir, cleanup: c } = makeTmpDirs();
    cleanup = c;

    watcher = new AssetWatcher({
      srcRoot,
      outDir,
      assets: [{ include: '**/*.json' }],
    });
    expect(watcher).toBeDefined();
  });

  // ── start(): copies pre-existing file to outDir ───────────────────────────

  it('should copy a pre-existing asset to outDir on start()', async () => {
    const { srcRoot, outDir, cleanup: c } = makeTmpDirs();
    cleanup = c;

    // Write a file BEFORE starting the watcher
    const srcFile = path.join(srcRoot, 'config.json');
    fs.writeFileSync(srcFile, '{"hello":"world"}');

    watcher = new AssetWatcher({ srcRoot, outDir, assets: [{ include: '**/*.json' }] });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for change event')), 9000);
      watcher.once('change', () => {
        clearTimeout(timer);
        resolve();
      });
      watcher.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      watcher.start();
    });

    const destFile = path.join(outDir, 'config.json');
    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('{"hello":"world"}');
  }, 15_000);

  // ── start(): copies newly added file ─────────────────────────────────────

  it('should copy a newly added asset file to outDir', async () => {
    const { srcRoot, outDir, cleanup: c } = makeTmpDirs();
    cleanup = c;

    watcher = new AssetWatcher({ srcRoot, outDir, assets: [{ include: '**/*.json' }] });
    watcher.start();

    // Wait for chokidar to be ready before writing a new file
    await waitReady(watcher);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for change event')), 9000);
      watcher.once('change', () => {
        clearTimeout(timer);
        resolve();
      });
      watcher.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      fs.writeFileSync(path.join(srcRoot, 'new.json'), '{}');
    });

    expect(fs.existsSync(path.join(outDir, 'new.json'))).toBe(true);
  }, 15_000);

  // ── start(): removes file from outDir on unlink ───────────────────────────

  it('should remove dest file when source asset is deleted', async () => {
    const { srcRoot, outDir, cleanup: c } = makeTmpDirs();
    cleanup = c;

    const srcFile = path.join(srcRoot, 'removable.json');
    fs.writeFileSync(srcFile, '{}');

    watcher = new AssetWatcher({ srcRoot, outDir, assets: [{ include: '**/*.json' }] });

    // Wait for initial copy
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for initial copy')), 9000);
      watcher.once('change', () => {
        clearTimeout(timer);
        resolve();
      });
      watcher.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      watcher.start();
    });

    const destFile = path.join(outDir, 'removable.json');
    expect(fs.existsSync(destFile)).toBe(true);

    // Wait for chokidar stabilization, then delete source
    await waitReady(watcher);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for unlink event')), 9000);
      watcher.once('change', () => {
        clearTimeout(timer);
        resolve();
      });
      watcher.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      fs.unlinkSync(srcFile);
    });

    expect(fs.existsSync(destFile)).toBe(false);
  }, 30_000);

  // ── close() is idempotent ─────────────────────────────────────────────────

  it('should close cleanly when never started', async () => {
    const { srcRoot, outDir, cleanup: c } = makeTmpDirs();
    cleanup = c;

    watcher = new AssetWatcher({ srcRoot, outDir, assets: [{ include: '**/*.json' }] });
    await expect(watcher.close()).resolves.toBeUndefined();
  });
});
