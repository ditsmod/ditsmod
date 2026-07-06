import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { jest } from '@jest/globals';

import { WatchCompiler, type CompilationResult } from './watch-compiler.js';

function makeTmpProject(sourceCode: string): { dir: string; tsconfig: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wc-spec-'));
  const srcDir = path.join(dir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'index.ts'), sourceCode);
  const tsconfig = path.join(dir, 'tsconfig.json');
  fs.writeFileSync(
    tsconfig,
    JSON.stringify({
      compilerOptions: {
        outDir: './dist',
        rootDir: './src',
        module: 'nodenext',
        moduleResolution: 'nodenext',
        target: 'esnext',
      },
      include: ['src'],
    }),
  );
  return { dir, tsconfig, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

describe('WatchCompiler', () => {
  let compiler: WatchCompiler;
  let stdoutSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy?.mockRestore();
    if (compiler) {
      compiler.close();
    }
  });

  it('should instantiate with tsconfig and options', () => {
    compiler = new WatchCompiler({
      tsconfig: 'tsconfig.build.json',
      preserveWatchOutput: true,
    });
    expect(compiler).toBeDefined();
  });

  it('should throw when tsconfig file is missing on start', () => {
    compiler = new WatchCompiler({
      tsconfig: 'non-existent-tsconfig.json',
    });

    expect(() => compiler.start()).toThrow('Cannot find TypeScript config file');
  });

  it('should emit compiled event with hasErrors=false for valid source', async () => {
    const { tsconfig, cleanup } = makeTmpProject('export const x = 1;\n');
    try {
      compiler = new WatchCompiler({ tsconfig, preserveWatchOutput: true });
      const result = await new Promise<CompilationResult>((resolve) => {
        compiler.once('compiled', resolve);
        compiler.start();
      });
      expect(result.hasErrors).toBe(false);
      expect(result.diagnostics).toHaveLength(0);
      expect(result.errorCount).toBe(0);
      expect(typeof result.duration).toBe('number');
    } finally {
      cleanup();
    }
  }, 15_000);

  it('should emit buildStart event before compiled event', async () => {
    const { tsconfig, cleanup } = makeTmpProject('export const x = 1;\n');
    try {
      compiler = new WatchCompiler({ tsconfig, preserveWatchOutput: true });
      let buildStartFired = false;
      compiler.once('buildStart', () => {
        buildStartFired = true;
      });
      const result = await new Promise<CompilationResult>((resolve) => {
        compiler.once('compiled', resolve);
        compiler.start();
      });
      expect(buildStartFired).toBe(true);
      expect(result.hasErrors).toBe(false);
    } finally {
      cleanup();
    }
  }, 15_000);

  it('should support verbose option and report status', async () => {
    const { tsconfig, cleanup } = makeTmpProject('export const x = 1;\n');
    try {
      compiler = new WatchCompiler({ tsconfig, preserveWatchOutput: true, verbose: true });
      const result = await new Promise<CompilationResult>((resolve) => {
        compiler.once('compiled', resolve);
        compiler.start();
      });
      expect(result.hasErrors).toBe(false);
      expect(stdoutSpy).toHaveBeenCalled();
    } finally {
      cleanup();
    }
  }, 15_000);

  it('should emit compiled event with hasErrors=true for source with type errors', async () => {
    const { tsconfig, cleanup } = makeTmpProject('const x: number = "not a number";\n');
    try {
      compiler = new WatchCompiler({ tsconfig, preserveWatchOutput: true });
      const result = await new Promise<CompilationResult>((resolve) => {
        compiler.once('compiled', resolve);
        compiler.start();
      });
      expect(result.hasErrors).toBe(true);
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.errorCount).toBeGreaterThan(0);
    } finally {
      cleanup();
    }
  }, 15_000);

  it('close() should be idempotent', () => {
    compiler = new WatchCompiler({ tsconfig: 'tsconfig.build.json' });
    expect(() => compiler.close()).not.toThrow();
    expect(() => compiler.close()).not.toThrow();
  });

  it('should emit compiled event for project references', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wc-composite-'));
    try {
      const libDir = path.join(dir, 'lib');
      const appDir = path.join(dir, 'app');
      fs.mkdirSync(path.join(libDir, 'src'), { recursive: true });
      fs.mkdirSync(path.join(appDir, 'src'), { recursive: true });

      fs.writeFileSync(path.join(libDir, 'src', 'index.ts'), 'export const val = 42;\n');
      fs.writeFileSync(
        path.join(libDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            composite: true,
            outDir: './dist',
            rootDir: './src',
            declaration: true,
            target: 'esnext',
            module: 'nodenext',
            moduleResolution: 'nodenext',
          },
          include: ['src'],
        }),
      );

      fs.writeFileSync(
        path.join(appDir, 'src', 'index.ts'),
        'import { val } from "../../lib/dist/index.js"; console.log(val);\n',
      );
      const appTsconfig = path.join(appDir, 'tsconfig.json');
      fs.writeFileSync(
        appTsconfig,
        JSON.stringify({
          compilerOptions: {
            outDir: './dist',
            rootDir: './src',
            target: 'esnext',
            module: 'nodenext',
            moduleResolution: 'nodenext',
          },
          include: ['src'],
          references: [{ path: '../lib' }],
        }),
      );

      compiler = new WatchCompiler({ tsconfig: appTsconfig, preserveWatchOutput: true });
      const result = await new Promise<CompilationResult>((resolve) => {
        compiler.once('compiled', resolve);
        compiler.start();
      });
      expect(result.hasErrors).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 15_000);
});
