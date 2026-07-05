import { type Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { WatchCompiler, type CompilationResult } from '../compiler/watch-compiler.js';
import { ProcessManager } from '../runner/process-manager.js';
import { AssetWatcher, type AssetEntry } from '../assets/asset-watcher.js';

export interface StartCommandOptions {
  project: string;
  exec: string;
  debug?: boolean | string;
  envFile?: string[];
  entryFile?: string;
  watchAssets?: string[];
  preserveWatchOutput: boolean;
}

/**
 * Registers the `ditsmod start [entryFile]` sub-command onto the given Commander program.
 */
export function startCommand(program: Command): void {
  program
    .command('start [entryFile]')
    .description('Run Ditsmod application')
    .option('-p, --project <path>', 'Path to TypeScript config file', 'tsconfig.build.json')
    .option('-e, --exec <binary>', 'Binary to run', 'node')
    .option('-d, --debug [hostport]', 'Run in debug mode (with --inspect flag)')
    .option('--env-file <paths...>', 'Path(s) to env file(s) to load into environment')
    .option('--entry-file <file>', 'Compiled entry file to run (relative to project root)', 'dist/main.js')
    .option('--watch-assets <globs...>', 'Non-TypeScript asset globs to watch and copy to dist/ (e.g., "src/**/*.json")')
    .option('--preserve-watch-output', 'Do not clear the screen between compilations', false)
    .action((entryFileArg: string | undefined, opts: StartCommandOptions) => runStart(entryFileArg, opts));
}

export async function runStart(entryFileArg: string | undefined, opts: StartCommandOptions): Promise<void> {
  const cwd = process.cwd();

  // If entryFileArg starts with -, it is an option/flag, not a file name
  const validEntryArg = entryFileArg?.startsWith('-') ? undefined : entryFileArg;
  const entryAbs = resolveEntryFile(cwd, validEntryArg || opts.entryFile);

  // Extract arguments passed after `--` to forward them to the application child process
  let appArgs: string[] = [];
  const dashDashIndex = process.argv.indexOf('--');
  if (dashDashIndex >= 0) {
    appArgs = process.argv.slice(dashDashIndex + 1);
  }

  const processManager = new ProcessManager({
    exec: opts.exec,
    debug: opts.debug,
    envFile: opts.envFile,
  });

  const compiler = new WatchCompiler({
    tsconfig: path.resolve(cwd, opts.project),
    preserveWatchOutput: opts.preserveWatchOutput,
  });

  // --- Asset watcher (optional) ---
  let assetWatcher: AssetWatcher | undefined;
  if (opts.watchAssets?.length) {
    const assetEntries: AssetEntry[] = opts.watchAssets.map((glob) => ({ include: glob }));
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
      processManager.start(entryAbs, appArgs);
    } else {
      console.log('\n[ditsmod] Restarting application…\n');
      await processManager.restart(entryAbs, appArgs);
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
export function resolveEntryFile(cwd: string, input?: string): string {
  const rawInput = input || 'dist/main.js';

  let entry = rawInput;
  if (path.isAbsolute(entry)) {
    entry = path.relative(cwd, entry);
  }

  let normalized = entry.replace(/\\/g, '/');
  if (normalized.startsWith('dist/')) {
    normalized = normalized.slice(5);
  } else if (normalized.startsWith('./dist/')) {
    normalized = normalized.slice(7);
  } else if (normalized.startsWith('src/')) {
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
