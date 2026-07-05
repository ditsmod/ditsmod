import { Command } from 'commander';
import { jest } from '@jest/globals';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { startCommand, runStart, resolveEntryFile, resolveProjectConfig, type StartCommandOptions } from './start.command.js';
import { ProcessManager } from '../runner/process-manager.js';

describe('startCommand options & parsing', () => {
  let program: Command;
  let parsedOpts: StartCommandOptions | undefined;
  let parsedEntryArg: string | undefined;

  beforeEach(() => {
    program = new Command();
    program.exitOverride(); // Prevent Commander from calling process.exit in tests
    parsedOpts = undefined;
    parsedEntryArg = undefined;

    // Register command with mock action handler
    startCommand(program);

    // Override action for unit testing parsed options
    const cmd = program.commands.find((c) => c.name() === 'start');
    if (cmd) {
      cmd.action((entryFileArg: string | undefined, opts: StartCommandOptions) => {
        parsedEntryArg = entryFileArg;
        parsedOpts = opts;
      });
    }
  });

  describe('CLI Options parsing', () => {
    it('should parse default options when no flags are passed', () => {
      program.parse(['node', 'test', 'start']);

      expect(parsedOpts).toBeDefined();
      expect(parsedOpts?.project).toBe('tsconfig.build.json');
      expect(parsedOpts?.exec).toBe('node');
      expect(parsedOpts?.debug).toBeUndefined();
      expect(parsedOpts?.envFile).toBeUndefined();
      expect(parsedOpts?.entryFile).toBeUndefined();
      expect(parsedOpts?.preserveWatchOutput).toBe(false);
      expect(parsedOpts?.watchAssets).toBeUndefined();
      expect(parsedEntryArg).toBeUndefined();
    });

    it('should parse -p / --project option', () => {
      program.parse(['node', 'test', 'start', '-p', 'tsconfig.custom.json']);

      expect(parsedOpts?.project).toBe('tsconfig.custom.json');
    });

    it('should parse -e / --exec option', () => {
      program.parse(['node', 'test', 'start', '-e', 'bun']);

      expect(parsedOpts?.exec).toBe('bun');
    });

    it('should parse -d / --debug flag without value', () => {
      program.parse(['node', 'test', 'start', '-d']);

      expect(parsedOpts?.debug).toBe(true);
    });

    it('should parse -d / --debug option with custom hostport', () => {
      program.parse(['node', 'test', 'start', '-d', '9229']);

      expect(parsedOpts?.debug).toBe('9229');
    });

    it('should parse --env-file option with array of paths', () => {
      program.parse(['node', 'test', 'start', '--env-file', '.env', '.env.local']);

      expect(parsedOpts?.envFile).toEqual(['.env', '.env.local']);
    });

    it('should parse --entry-file option', () => {
      program.parse(['node', 'test', 'start', '--entry-file', 'dist/server.js']);

      expect(parsedOpts?.entryFile).toBe('dist/server.js');
    });

    it('should parse positional [entryFile] argument', () => {
      program.parse(['node', 'test', 'start', 'src/app.ts']);

      expect(parsedEntryArg).toBe('src/app.ts');
    });

    it('should parse --watch-assets array option', () => {
      program.parse(['node', 'test', 'start', '--watch-assets', 'src/**/*.json', 'src/**/*.graphql']);

      expect(parsedOpts?.watchAssets).toEqual(['src/**/*.json', 'src/**/*.graphql']);
    });

    it('should parse --preserve-watch-output boolean flag', () => {
      program.parse(['node', 'test', 'start', '--preserve-watch-output']);

      expect(parsedOpts?.preserveWatchOutput).toBe(true);
    });
  });

  describe('resolveProjectConfig helper', () => {
    const cwd = process.cwd();

    it('should resolve default tsconfig.build.json or fallback tsconfig.json in cwd', () => {
      const result = resolveProjectConfig(cwd, 'tsconfig.build.json');
      expect(result.projectDir).toBe('.');
      expect(result.projectFile).toMatch(/tsconfig(\.build)?\.json/);
    });

    it('should resolve directory input by searching tsconfig.build.json or tsconfig.json inside it', () => {
      const result = resolveProjectConfig(cwd, '.');
      expect(result.projectDir).toBe('.');
      expect(result.projectFile).toMatch(/tsconfig(\.build)?\.json/);
    });

    it('should throw error if input file or directory tsconfig does not exist', () => {
      expect(() => resolveProjectConfig(cwd, 'non-existent-directory-xyz')).toThrow(
        'Cannot find TypeScript config file "non-existent-directory-xyz".',
      );
    });
  });

  describe('resolveEntryFile helper', () => {
    const cwd = process.cwd();

    it('should resolve undefined input to dist/main.js', () => {
      const result = resolveEntryFile(cwd, undefined);
      expect(result).toBe(path.resolve(cwd, 'dist/main.js'));
    });

    it('should resolve undefined input with projectDir apps/backend to apps/backend/dist/main.js', () => {
      const result = resolveEntryFile(cwd, undefined, 'apps/backend');
      expect(result).toBe(path.resolve(cwd, 'apps/backend/dist/main.js'));
    });

    it('should resolve tmp.ts to dist/tmp.js', () => {
      const result = resolveEntryFile(cwd, 'tmp.ts');
      expect(result).toBe(path.resolve(cwd, 'dist/tmp.js'));
    });

    it('should resolve src/tmp.ts to dist/tmp.js', () => {
      const result = resolveEntryFile(cwd, 'src/tmp.ts');
      expect(result).toBe(path.resolve(cwd, 'dist/tmp.js'));
    });

    it('should resolve ./src/app/main.ts to dist/app/main.js', () => {
      const result = resolveEntryFile(cwd, './src/app/main.ts');
      expect(result).toBe(path.resolve(cwd, 'dist/app/main.js'));
    });

    it('should resolve dist/custom.js to dist/custom.js', () => {
      const result = resolveEntryFile(cwd, 'dist/custom.js');
      expect(result).toBe(path.resolve(cwd, 'dist/custom.js'));
    });
  });
});

describe('runStart execution flow', () => {
  let tmpDir: string;
  let processManagerStartSpy: ReturnType<typeof jest.spyOn>;
  let exitSpy: ReturnType<typeof jest.spyOn>;
  let stdoutSpy: ReturnType<typeof jest.spyOn>;
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'start-cmd-spec-'));
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src/index.ts'), 'export const a = 1;\n');
    fs.writeFileSync(
      path.join(tmpDir, 'tsconfig.build.json'),
      JSON.stringify({
        compilerOptions: { outDir: './dist', moduleResolution: 'node' },
        include: ['src/**/*'],
      }),
    );
    fs.mkdirSync(path.join(tmpDir, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'dist/main.js'), 'console.log("hello");');

    processManagerStartSpy = jest.spyOn(ProcessManager.prototype, 'start').mockImplementation(() => {});
    // Prevent process.exit(0) in shutdown from terminating Jest process
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    consoleLogSpy.mockRestore();
    processManagerStartSpy.mockRestore();
    exitSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should trigger ProcessManager.start on initial compilation', async () => {
    const startPromise = runStart(undefined, {
      project: path.join(tmpDir, 'tsconfig.build.json'),
      exec: 'node',
      preserveWatchOutput: true,
    });

    // Wait for compiler to emit initial event and processManager.start to be called
    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(processManagerStartSpy).toHaveBeenCalledWith(
      path.resolve(tmpDir, 'dist/main.js'),
      [],
    );

    // Stop the watch loop gracefully by emitting SIGINT
    process.emit('SIGINT');
    await startPromise;
  }, 10_000);
});
