import { Command } from 'commander';
import { newCommand, TEMPLATE_REPOS, type NewCommandOptions } from './new.command.js';

describe('newCommand options & parsing', () => {
  let program: Command;
  let parsedOpts: NewCommandOptions | undefined;
  let parsedDirArg: string | undefined;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    parsedOpts = undefined;
    parsedDirArg = undefined;

    newCommand(program);

    const cmd = program.commands.find((c) => c.name() === 'new');
    if (cmd) {
      cmd.action((directoryArg: string, opts: NewCommandOptions) => {
        parsedDirArg = directoryArg;
        parsedOpts = opts;
      });
    }
  });

  it('should parse default options when directory is passed', () => {
    program.parse(['node', 'test', 'new', 'my-app']);

    expect(parsedOpts).toBeDefined();
    expect(parsedOpts?.template).toBe('rest');
    expect(parsedOpts?.packageManager).toBe('npm');
    expect(parsedOpts?.skipInstall).toBe(false);
    expect(parsedOpts?.skipGit).toBe(false);
    expect(parsedDirArg).toBe('my-app');
  });

  it('should throw error when required directory argument is missing', () => {
    expect(() => program.parse(['node', 'test', 'new'])).toThrow("missing required argument 'directory'");
  });

  it('should parse positional <directory> argument', () => {
    program.parse(['node', 'test', 'new', 'my-api']);

    expect(parsedDirArg).toBe('my-api');
  });

  it('should parse -t / --template option', () => {
    program.parse(['node', 'test', 'new', 'my-app', '-t', 'rest-monorepo']);

    expect(parsedOpts?.template).toBe('rest-monorepo');
  });

  it('should parse -m / --package-manager option', () => {
    program.parse(['node', 'test', 'new', 'my-app', '-m', 'yarn']);

    expect(parsedOpts?.packageManager).toBe('yarn');
  });

  it('should parse --skip-install flag', () => {
    program.parse(['node', 'test', 'new', 'my-app', '--skip-install']);

    expect(parsedOpts?.skipInstall).toBe(true);
  });

  it('should parse --skip-git flag', () => {
    program.parse(['node', 'test', 'new', 'my-app', '--skip-git']);

    expect(parsedOpts?.skipGit).toBe(true);
  });

  it('should contain valid template repositories map', () => {
    expect(TEMPLATE_REPOS['rest']).toBe('https://github.com/ditsmod/rest-starter.git');
    expect(TEMPLATE_REPOS['rest-monorepo']).toBe('https://github.com/ditsmod/rest-monorepo-starter.git');
    expect(TEMPLATE_REPOS['trpc-monorepo']).toBe('https://github.com/ditsmod/trpc-monorepo-starter.git');
  });
});
