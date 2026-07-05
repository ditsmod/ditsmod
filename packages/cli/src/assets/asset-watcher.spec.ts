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

    // Small delay for watch listener setup
    await new Promise((r) => setTimeout(r, 200));

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

  // ── start(): removes file from outDir on deletion ──────────────────────────

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

    // Small delay before unlinking
    await new Promise((r) => setTimeout(r, 200));

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
  }, 15_000);

  // ── exclude pattern filtering ─────────────────────────────────────────────

  it('should ignore files matching exclude patterns', async () => {
    const { srcRoot, outDir, cleanup: c } = makeTmpDirs();
    cleanup = c;

    const includedFile = path.join(srcRoot, 'included.json');
    const excludedFile = path.join(srcRoot, 'excluded.tmp.json');

    fs.writeFileSync(includedFile, '{}');
    fs.writeFileSync(excludedFile, '{}');

    watcher = new AssetWatcher({
      srcRoot,
      outDir,
      assets: [{ include: '**/*.json', exclude: '**/*.tmp.json' }],
    });

    watcher.start();

    await new Promise((r) => setTimeout(r, 300));

    expect(fs.existsSync(path.join(outDir, 'included.json'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'excluded.tmp.json'))).toBe(false);
  });

  // ── Subdirectory mirroring ────────────────────────────────────────────────

  it('should mirror subdirectory structure correctly', async () => {
    const { srcRoot, outDir, cleanup: c } = makeTmpDirs();
    cleanup = c;

    const subDir = path.join(srcRoot, 'nested', 'deep');
    fs.mkdirSync(subDir, { recursive: true });
    const srcFile = path.join(subDir, 'schema.graphql');
    fs.writeFileSync(srcFile, 'type Query { id: ID! }');

    watcher = new AssetWatcher({
      srcRoot,
      outDir,
      assets: [{ include: '**/*.graphql' }],
    });

    watcher.start();

    await new Promise((r) => setTimeout(r, 300));

    const destFile = path.join(outDir, 'nested', 'deep', 'schema.graphql');
    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('type Query { id: ID! }');
  });

  // ── close() is idempotent ─────────────────────────────────────────────────

  it('should close cleanly when never started', async () => {
    const { srcRoot, outDir, cleanup: c } = makeTmpDirs();
    cleanup = c;

    watcher = new AssetWatcher({ srcRoot, outDir, assets: [{ include: '**/*.json' }] });
    await expect(watcher.close()).resolves.toBeUndefined();
  });
});
