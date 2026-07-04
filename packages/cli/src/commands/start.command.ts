import { type Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { WatchCompiler, type CompilationResult } from '../compiler/watch-compiler.js';
import { ProcessManager } from '../runner/process-manager.js';
import { AssetWatcher, type AssetEntry } from '../assets/asset-watcher.js';

export interface StartCommandOptions {
  project: string;
  entryFile?: string;
  assets?: string[];
  preserveWatchOutput: boolean;
  killTimeout: number;
}

/**
 * Registers the `ditsmod start [entryFile]` sub-command onto the given Commander program.
 */
export function startCommand(program: Command): void {
  program
    .command('start [entryFile]')
    .description('Run Ditsmod application')
    .option('-p, --project <path>', 'Path to TypeScript config file', 'tsconfig.build.json')
    .option('--entry-file <file>', 'Compiled entry file to run (relative to project root)', 'dist/main.js')
    .option('-a, --assets <globs...>', 'Non-TypeScript asset globs to watch and copy to dist/ (e.g., "src/**/*.json")')
    .option('--preserve-watch-output', 'Do not clear the screen between compilations', false)
    .option(
      '--kill-timeout <ms>',
      'Milliseconds to wait for the app to shut down before force-killing it',
      (v) => parseInt(v, 10),
      5000,
    )
    .action((entryFileArg: string | undefined, opts: StartCommandOptions) => runStart(entryFileArg, opts));
}

async function runStart(entryFileArg: string | undefined, opts: StartCommandOptions): Promise<void> {
  const cwd = process.cwd();
  const entryAbs = resolveEntryFile(cwd, entryFileArg || opts.entryFile);

  const processManager = new ProcessManager({
    killTimeout: opts.killTimeout,
  });

  const compiler = new WatchCompiler({
    tsconfig: path.resolve(cwd, opts.project),
    preserveWatchOutput: opts.preserveWatchOutput,
  });

  // --- Asset watcher (optional) ---
  let assetWatcher: AssetWatcher | undefined;
  if (opts.assets?.length) {
    const assetEntries: AssetEntry[] = opts.assets.map((glob) => ({ include: glob }));
    assetWatcher = new AssetWatcher({
      srcRoot: path.resolve(cwd, 'src'),
      outDir: path.resolve(cwd, 'dist'),
      assets: assetEntries,
    });
    assetWatcher.on('error', (err: Error) => {
      console.error('[AssetWatcher] Error:', err.message);
    });
    assetWatcher.start();
  }

  // --- Compiler events ---
  let started = false;

  compiler.on('compiled', async (result: CompilationResult) => {
    if (result.hasErrors) {
      // Don't restart — keep the last working build running
      return;
    }

    if (!started) {
      started = true;
      console.log('\n[ditsmod] Starting application…\n');
      processManager.start(entryAbs);
    } else {
      console.log('\n[ditsmod] Restarting application…\n');
      await processManager.restart(entryAbs);
    }
  });

  compiler.on('error', (err: Error) => {
    console.error('[ditsmod] Compiler error:', err.message);
  });

  // --- Start compiler ---
  compiler.start();

  // --- Graceful shutdown on Ctrl+C ---
  const shutdown = async () => {
    compiler.close();
    await assetWatcher?.close();
    await processManager.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Intelligently resolves the compiled .js output entry file path.
 * Handles inputs like:
 * - `tmp.ts` -> `dist/tmp.js`
 * - `src/tmp.ts` -> `dist/tmp.js`
 * - `tmp` -> `dist/tmp.js`
 * - `dist/main.js` -> `dist/main.js`
 */
function resolveEntryFile(cwd: string, input?: string): string {
  const rawInput = input || 'dist/main.js';

  let entry = rawInput;
  if (path.isAbsolute(entry)) {
    entry = path.relative(cwd, entry);
  }

  let normalized = entry.replace(/\\/g, '/');
  if (normalized.startsWith('src/')) {
    normalized = normalized.slice(4);
  } else if (normalized.startsWith('./src/')) {
    normalized = normalized.slice(6);
  }

  normalized = normalized.replace(/\.(ts|mts|cts|js|mjs)$/, '');

  const candidate1 = path.resolve(cwd, 'dist', `${normalized}.js`);
  const candidate2 = path.resolve(cwd, 'dist', 'src', `${normalized}.js`);
  const rawCandidate = path.resolve(cwd, rawInput);

  if (fs.existsSync(candidate1)) {
    return candidate1;
  }
  if (fs.existsSync(candidate2)) {
    return candidate2;
  }
  if (fs.existsSync(rawCandidate)) {
    return rawCandidate;
  }

  return candidate1;
}
