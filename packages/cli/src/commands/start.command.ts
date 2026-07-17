import { type Command } from 'commander';
import { on } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
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
  verbose: boolean;
  restartDelay: string;
}

export interface ResolvedProjectConfig {
  projectFile: string;
  projectDir: string;
}

/**
 * Registers the `ditsmod start [entryFile]` sub-command onto the given Commander program.
 */
export function startCommand(program: Command): void {
  program
    .command('start [entryFile]')
    .usage('[options] [entryFile]\n       dm start [options] [entryFile]')
    .description('Run Ditsmod application')
    .option('-p, --project <path>', 'Path to TypeScript config file or project directory', 'tsconfig.build.json')
    .option('-e, --exec <binary>', 'Binary to run', 'node')
    .option('-d, --debug [hostport]', 'Run in debug mode (with --inspect flag)')
    .option('--env-file <paths...>', 'Path(s) to env file(s) to load into environment')
    .option('--entry-file <file>', 'Compiled entry file to run (relative to project root)')
    .option(
      '--watch-assets <globs...>',
      'Non-TypeScript asset globs to watch and copy to dist/ (e.g., "src/**/*.json")',
    )
    .option('--preserve-watch-output', 'Do not clear the screen between compilations', false)
    .option('--verbose', 'Show verbose TypeScript project references progress', false)
    .option('--restart-delay <ms>', 'Delay in ms before restarting after successful compilation', '300')
    .action((entryFileArg: string | undefined, opts: StartCommandOptions) => runStart(entryFileArg, opts));
}

export async function runStart(entryFileArg: string | undefined, opts: StartCommandOptions): Promise<void> {
  const cwd = process.cwd();
  const { projectFile, projectDir } = resolveProjectConfig(cwd, opts.project);

  // If entryFileArg starts with -, it is an option/flag, not a file name
  const validEntryArg = entryFileArg?.startsWith('-') ? undefined : entryFileArg;
  const entryAbs = resolveEntryFile(cwd, validEntryArg || opts.entryFile, projectDir, projectFile);

  // Auto-detect .env file in projectDir if --env-file was not explicitly provided
  let resolvedEnvFile = opts.envFile;
  if (!resolvedEnvFile?.length) {
    const defaultEnvFile = path.resolve(cwd, projectDir, '.env');
    if (fs.existsSync(defaultEnvFile)) {
      resolvedEnvFile = [defaultEnvFile];
    }
  }

  // Extract arguments passed after `--` to forward them to the application child process
  let appArgs: string[] = [];
  const dashDashIndex = process.argv.indexOf('--');
  if (dashDashIndex >= 0) {
    appArgs = process.argv.slice(dashDashIndex + 1);
  }

  const processManager = new ProcessManager({
    exec: opts.exec,
    debug: opts.debug,
    envFile: resolvedEnvFile,
  });

  const compiler = new WatchCompiler({
    tsconfig: path.resolve(cwd, projectFile),
    preserveWatchOutput: opts.preserveWatchOutput,
    verbose: opts.verbose,
  });

  // --- Asset watcher (optional) ---
  let assetWatcher: AssetWatcher | undefined;
  if (opts.watchAssets?.length) {
    const assetEntries: AssetEntry[] = opts.watchAssets.map((glob) => ({ include: glob }));
    assetWatcher = new AssetWatcher({
      srcRoot: path.resolve(cwd, projectDir, 'src'),
      outDir: path.resolve(cwd, projectDir, 'dist'),
      assets: assetEntries,
    });
    assetWatcher.on('error', (err: Error) => {
      console.error('[AssetWatcher] Error:', err.message);
    });
    assetWatcher.start();
  }

  compiler.on('error', (err: Error) => {
    console.error('[ditsmod] Compiler error:', err.message);
  });

  // --- Graceful shutdown on Ctrl+C via AbortController ---
  const ac = new AbortController();
  const shutdown = () => ac.abort();

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  process.once('SIGHUP', shutdown);
  process.once('SIGQUIT', shutdown);

  // Create event stream BEFORE starting compiler to capture the initial synchronous 'compiled' event
  const compiledEvents = on(compiler, 'compiled', { signal: ac.signal });

  let started = false;

  compiler.on('buildStart', () => {
    if (started) {
      console.log('\n[ditsmod] File change detected. Compiling…\n');
    }
  });

  // --- Start compiler ---
  compiler.start();

  let restartTimer: NodeJS.Timeout | null = null;
  const parsedDelay = parseInt(opts.restartDelay, 10);
  const restartDelayMs = Number.isNaN(parsedDelay) ? 300 : parsedDelay;

  try {
    for await (const [result] of compiledEvents) {
      const compilationResult = result as CompilationResult;
      if (compilationResult.hasErrors) {
        // Don't restart — keep the last working build running
        continue;
      }

      if (opts.verbose && compilationResult.duration !== undefined) {
        const seconds = (compilationResult.duration / 1000).toFixed(2);
        console.log(`\n[ditsmod] Compilation completed in ${seconds} s.`);
      }

      if (!started) {
        started = true;
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [ditsmod] Starting application…\n`);
        processManager.start(entryAbs, appArgs);
      } else {
        const restartApp = async () => {
          restartTimer = null;
          if (!opts.preserveWatchOutput && !opts.verbose) {
            process.stdout.write('\x1Bc');
          }
          const timestamp = new Date().toLocaleTimeString();
          console.log(`[${timestamp}] [ditsmod] Restarting application…\n`);
          try {
            await processManager.restart(entryAbs, appArgs);
          } catch (err: any) {
            console.error('[ditsmod] Error restarting application:', err?.message || err);
          }
        };

        if (restartTimer) clearTimeout(restartTimer);
        restartTimer = setTimeout(() => {
          void restartApp();
        }, restartDelayMs);
      }
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.error('[ditsmod] Unexpected error in watch loop:', err);
    }
  } finally {
    if (restartTimer) clearTimeout(restartTimer);
    compiler.close();
    await assetWatcher?.close();
    await processManager.stop();
    process.removeListener('SIGINT', shutdown);
    process.removeListener('SIGTERM', shutdown);
    process.removeListener('SIGHUP', shutdown);
    process.removeListener('SIGQUIT', shutdown);
  }
}

/**
 * Intelligently resolves project config file and directory.
 * Accepts:
 * - A directory path (e.g. `apps/backend`) -> looks for `tsconfig.build.json`, then `tsconfig.json` inside it.
 * - A file path (e.g. `apps/backend/tsconfig.build.json`) -> checks existence and derives directory.
 * - Default `tsconfig.build.json` -> checks `tsconfig.build.json`, falls back to `tsconfig.json`.
 */
export function resolveProjectConfig(cwd: string, input: string): ResolvedProjectConfig {
  const resolvedInput = path.resolve(cwd, input);

  if (fs.existsSync(resolvedInput) && fs.statSync(resolvedInput).isDirectory()) {
    const buildConfig = path.join(resolvedInput, 'tsconfig.build.json');
    const defaultConfig = path.join(resolvedInput, 'tsconfig.json');

    if (fs.existsSync(buildConfig)) {
      return {
        projectFile: path.relative(cwd, buildConfig),
        projectDir: path.relative(cwd, resolvedInput) || '.',
      };
    }
    if (fs.existsSync(defaultConfig)) {
      return {
        projectFile: path.relative(cwd, defaultConfig),
        projectDir: path.relative(cwd, resolvedInput) || '.',
      };
    }

    throw new Error(`Cannot find "tsconfig.build.json" or "tsconfig.json" in directory "${input}".`);
  }

  if (fs.existsSync(resolvedInput)) {
    return {
      projectFile: input,
      projectDir: path.dirname(input) || '.',
    };
  }

  // If default 'tsconfig.build.json' was passed but doesn't exist, fallback to 'tsconfig.json'
  if (input === 'tsconfig.build.json') {
    const fallbackConfig = path.resolve(cwd, 'tsconfig.json');
    if (fs.existsSync(fallbackConfig)) {
      return {
        projectFile: 'tsconfig.json',
        projectDir: '.',
      };
    }
  }

  throw new Error(`Cannot find TypeScript config file "${input}".`);
}

/**
 * Intelligently resolves the compiled .js output entry file path.
 * Respects `projectDir` derived from tsconfig location (e.g. `apps/backend`).
 * Handles inputs like:
 * - `tmp.ts` -> `dist/tmp.js`
 * - `src/tmp.ts` -> `dist/tmp.js`
 * - `tmp` -> `dist/tmp.js`
 * - `dist/main.js` -> `dist/main.js`
 */
export function resolveEntryFile(cwd: string, input?: string, projectDir: string = '.', projectFile?: string): string {
  const baseDir = path.resolve(cwd, projectDir);
  let outDir = 'dist';
  let rootDir = 'src';

  if (projectFile) {
    const configPath = path.resolve(cwd, projectFile);
    try {
      const parsedConfig = ts.getParsedCommandLineOfConfigFile(
        configPath,
        {},
        {
          useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
          readDirectory: ts.sys.readDirectory,
          fileExists: ts.sys.fileExists,
          readFile: ts.sys.readFile,
          getCurrentDirectory: ts.sys.getCurrentDirectory,
          onUnRecoverableConfigFileDiagnostic: () => {},
        },
      );
      if (parsedConfig?.options) {
        if (typeof parsedConfig.options.outDir === 'string') {
          outDir = path.relative(baseDir, parsedConfig.options.outDir) || 'dist';
        }
        if (typeof parsedConfig.options.rootDir === 'string') {
          rootDir = path.relative(baseDir, parsedConfig.options.rootDir) || 'src';
        }
      }
    } catch {
      // Fallback to default dist/src
    }
  }

  const rawInput = input || path.join(projectDir, outDir, 'main.js');

  let entry = rawInput;
  if (path.isAbsolute(entry)) {
    entry = path.relative(cwd, entry);
  }

  let normalized = entry.replace(/\\/g, '/');
  const normalizedProjDir = projectDir.replace(/\\/g, '/').replace(/^\.\//, '');
  if (normalizedProjDir && normalizedProjDir !== '.' && normalized.startsWith(normalizedProjDir + '/')) {
    normalized = normalized.slice(normalizedProjDir.length + 1);
  }

  const outDirPrefix = outDir.replace(/\\/g, '/') + '/';
  const rootDirPrefix = rootDir.replace(/\\/g, '/') + '/';

  if (normalized.startsWith(outDirPrefix)) {
    normalized = normalized.slice(outDirPrefix.length);
  } else if (normalized.startsWith('./' + outDirPrefix)) {
    normalized = normalized.slice(outDirPrefix.length + 2);
  } else if (normalized.startsWith(rootDirPrefix)) {
    normalized = normalized.slice(rootDirPrefix.length);
  } else if (normalized.startsWith('./' + rootDirPrefix)) {
    normalized = normalized.slice(rootDirPrefix.length + 2);
  }

  normalized = normalized.replace(/\.(ts|mts|cts|js|mjs)$/, '');

  const candidate1 = path.resolve(baseDir, outDir, `${normalized}.js`);
  const candidate2 = path.resolve(baseDir, outDir, rootDir, `${normalized}.js`);
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
