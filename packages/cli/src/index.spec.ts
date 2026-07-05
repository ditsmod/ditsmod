import * as cliExports from './index.js';

describe('@ditsmod/cli public API', () => {
  it('should export WatchCompiler class', () => {
    expect(cliExports.WatchCompiler).toBeDefined();
    expect(typeof cliExports.WatchCompiler).toBe('function');
  });

  it('should export ProcessManager class', () => {
    expect(cliExports.ProcessManager).toBeDefined();
    expect(typeof cliExports.ProcessManager).toBe('function');
  });

  it('should export AssetWatcher class', () => {
    expect(cliExports.AssetWatcher).toBeDefined();
    expect(typeof cliExports.AssetWatcher).toBe('function');
  });

  it('should export startCommand function', () => {
    expect(typeof cliExports.startCommand).toBe('function');
  });

  it('should export newCommand function', () => {
    expect(typeof cliExports.newCommand).toBe('function');
  });

  it('should export TEMPLATE_REPOS constant', () => {
    expect(cliExports.TEMPLATE_REPOS).toBeDefined();
    expect(typeof cliExports.TEMPLATE_REPOS).toBe('object');
  });
});
