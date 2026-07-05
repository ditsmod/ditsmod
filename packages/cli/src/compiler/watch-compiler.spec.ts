import { WatchCompiler } from './watch-compiler.js';

describe('WatchCompiler', () => {
  let compiler: WatchCompiler;

  afterEach(() => {
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
});
