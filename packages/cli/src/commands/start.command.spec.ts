import { Command } from 'commander';
import path from 'node:path';
import { startCommand, resolveEntryFile, type StartCommandOptions } from './start.command.js';

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
    const cmd = program
      .command('start [entryFile]')
      .description('Run Ditsmod application')
      .option('-p, --project <path>', 'Path to TypeScript config file', 'tsconfig.build.json')
      .option('--entry-file <file>', 'Compiled entry file to run (relative to project root)', 'dist/main.js')
      .option('-a, --assets <globs...>', 'Non-TypeScript asset globs to watch and copy to dist/')
      .option('--preserve-watch-output', 'Do not clear the screen between compilations', false)
      .option(
        '--kill-timeout <ms>',
        'Milliseconds to wait for the app to shut down before force-killing it',
        (v) => parseInt(v, 10),
        5000,
      )
      .action((entryFileArg: string | undefined, opts: StartCommandOptions) => {
        parsedEntryArg = entryFileArg;
        parsedOpts = opts;
      });
  });

  describe('CLI Options parsing', () => {
    it('should parse default options when no flags are passed', () => {
      program.parse(['node', 'test', 'start']);

      expect(parsedOpts).toBeDefined();
      expect(parsedOpts?.project).toBe('tsconfig.build.json');
      expect(parsedOpts?.entryFile).toBe('dist/main.js');
      expect(parsedOpts?.preserveWatchOutput).toBe(false);
      expect(parsedOpts?.killTimeout).toBe(5000);
      expect(parsedOpts?.assets).toBeUndefined();
      expect(parsedEntryArg).toBeUndefined();
    });

    it('should parse -p / --project option', () => {
      program.parse(['node', 'test', 'start', '-p', 'tsconfig.custom.json']);

      expect(parsedOpts?.project).toBe('tsconfig.custom.json');
    });

    it('should parse --entry-file option', () => {
      program.parse(['node', 'test', 'start', '--entry-file', 'dist/server.js']);

      expect(parsedOpts?.entryFile).toBe('dist/server.js');
    });

    it('should parse positional [entryFile] argument', () => {
      program.parse(['node', 'test', 'start', 'src/app.ts']);

      expect(parsedEntryArg).toBe('src/app.ts');
    });

    it('should parse -a / --assets array option', () => {
      program.parse(['node', 'test', 'start', '-a', 'src/**/*.json', 'src/**/*.graphql']);

      expect(parsedOpts?.assets).toEqual(['src/**/*.json', 'src/**/*.graphql']);
    });

    it('should parse --preserve-watch-output boolean flag', () => {
      program.parse(['node', 'test', 'start', '--preserve-watch-output']);

      expect(parsedOpts?.preserveWatchOutput).toBe(true);
    });

    it('should parse --kill-timeout number option', () => {
      program.parse(['node', 'test', 'start', '--kill-timeout', '3000']);

      expect(parsedOpts?.killTimeout).toBe(3000);
    });
  });

  describe('resolveEntryFile helper', () => {
    const cwd = process.cwd();

    it('should resolve undefined input to dist/main.js', () => {
      const result = resolveEntryFile(cwd, undefined);
      expect(result).toBe(path.resolve(cwd, 'dist/main.js'));
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
