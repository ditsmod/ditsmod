import { type Command } from 'commander';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface NewCommandOptions {
  template: 'rest' | 'rest-monorepo' | 'trpc-monorepo' | string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | string;
  skipInstall: boolean;
  skipGit: boolean;
}

export const TEMPLATE_REPOS: Record<string, string> = {
  rest: 'https://github.com/ditsmod/rest-starter.git',
  'rest-monorepo': 'https://github.com/ditsmod/rest-monorepo-starter.git',
  'trpc-monorepo': 'https://github.com/ditsmod/trpc-monorepo-starter.git',
};

/**
 * Registers the `ditsmod new <directory>` sub-command onto the given Commander program.
 */
export function newCommand(program: Command): void {
  program
    .command('new <directory>')
    .usage('<directory> [options]\n       dm new <directory> [options]')
    .description('Create a new Ditsmod application')
    .option('-t, --template <name>', 'App template: rest, rest-monorepo, trpc-monorepo', 'rest')
    .option('-m, --package-manager <name>', 'Package manager: npm, yarn, pnpm', 'npm')
    .option('--skip-install', 'Do not install dependencies', false)
    .option('--skip-git', 'Do not initialize git repository', false)
    .action((directoryArg: string, opts: NewCommandOptions) => runNew(directoryArg, opts));
}

export async function runNew(directoryArg: string, opts: NewCommandOptions): Promise<void> {
  if (!directoryArg) {
    throw new Error("Missing required argument 'directory'. Usage: ditsmod new <directory>");
  }

  const targetDirName = directoryArg;
  const cwd = process.cwd();
  const targetAbsDir = path.resolve(cwd, targetDirName);

  const templateName = opts.template.toLowerCase();
  const repoUrl = TEMPLATE_REPOS[templateName];

  if (!repoUrl) {
    const validTemplates = Object.keys(TEMPLATE_REPOS).join(', ');
    throw new Error(`Unknown template "${opts.template}". Available templates: ${validTemplates}`);
  }

  if (fs.existsSync(targetAbsDir)) {
    const files = fs.readdirSync(targetAbsDir);
    if (files.length > 0) {
      throw new Error(`Directory "${targetDirName}" already exists and is not empty.`);
    }
  }

  let createdDir = false;
  let cancelled = false;

  // --- Signal Handling for Ctrl+C (SIGINT) ---
  const cleanup = () => {
    cancelled = true;
  };

  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);

  try {
    console.log(`\n[ditsmod] Creating a new Ditsmod application in ${targetAbsDir}…\n`);
    console.log(`Using template: ${templateName} (${repoUrl})`);

    // 1. Clone starter repository
    execFileSync('git', ['clone', '--depth', '1', repoUrl, targetAbsDir], { stdio: 'inherit' });
    createdDir = true;

    if (cancelled) {
      throw Object.assign(new Error('Operation cancelled'), { signal: 'SIGINT', status: 130 });
    }

    // 2. Remove template .git directory
    const gitDir = path.join(targetAbsDir, '.git');
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }

    // 3. Update package.json name field
    const pkgJsonPath = path.join(targetAbsDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkgContent = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        pkgContent.name = path.basename(targetAbsDir);
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgContent, null, 2) + '\n');
      } catch {
        // Ignore JSON parse errors if any
      }
    }

    if (cancelled) {
      throw Object.assign(new Error('Operation cancelled'), { signal: 'SIGINT', status: 130 });
    }

    // 4. Initialize clean git repository if not skipped
    if (!opts.skipGit) {
      try {
        console.log('\n[ditsmod] Initializing git repository…');
        execFileSync('git', ['init'], { cwd: targetAbsDir, stdio: 'ignore' });
        execFileSync('git', ['add', '.'], { cwd: targetAbsDir, stdio: 'ignore' });
        execFileSync('git', ['commit', '-m', `Initial commit from ${templateName} template`], {
          cwd: targetAbsDir,
          stdio: 'ignore',
        });
      } catch {
        console.warn('[ditsmod] Could not initialize git repository.');
      }
    }

    if (cancelled) {
      throw Object.assign(new Error('Operation cancelled'), { signal: 'SIGINT', status: 130 });
    }

    // 5. Install dependencies if not skipped
    if (!opts.skipInstall) {
      const pm = opts.packageManager || 'npm';
      const allowedPMs = ['npm', 'yarn', 'pnpm'];
      if (!allowedPMs.includes(pm)) {
        throw new Error(`Unsupported package manager "${pm}". Allowed values: ${allowedPMs.join(', ')}.`);
      }
      console.log(`\n[ditsmod] Installing dependencies using ${pm}…\n`);
      execFileSync(pm, ['install'], { cwd: targetAbsDir, stdio: 'inherit' });
    }

    console.log(`\n Successfully created project "${targetDirName}"!\n`);
    console.log(`  cd ${targetDirName}`);
    if (opts.skipInstall) {
      console.log(`  ${opts.packageManager || 'npm'} install`);
    }
    console.log(`  ${opts.packageManager || 'npm'} start\n`);
  } catch (err: any) {
    if (cancelled || err?.signal === 'SIGINT' || err?.status === 130) {
      console.log('\n\n[ditsmod] Operation cancelled. Cleaning up temporary files…');
      if (createdDir && fs.existsSync(targetAbsDir)) {
        try {
          fs.rmSync(targetAbsDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
      process.exitCode = 130;
      return;
    }

    // If failed for other reasons, clean up partial directory if created
    if (createdDir && fs.existsSync(targetAbsDir)) {
      try {
        fs.rmSync(targetAbsDir, { recursive: true, force: true });
      } catch {
        // Ignore
      }
    }
    throw err;
  } finally {
    process.removeListener('SIGINT', cleanup);
    process.removeListener('SIGTERM', cleanup);
  }
}
