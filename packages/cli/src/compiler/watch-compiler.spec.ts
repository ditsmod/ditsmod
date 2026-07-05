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
      compilerOptions: { outDir: './dist', module: 'nodenext', moduleResolution: 'nodenext', target: 'esnext' },
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
    } finally {
      cleanup();
    }
  }, 15_000);

  it('close() should be idempotent', () => {
    compiler = new WatchCompiler({ tsconfig: 'tsconfig.build.json' });
    expect(() => compiler.close()).not.toThrow();
    expect(() => compiler.close()).not.toThrow();
  });
});
