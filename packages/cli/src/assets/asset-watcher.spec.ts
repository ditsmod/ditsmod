import { AssetWatcher } from './asset-watcher.js';

describe('AssetWatcher', () => {
  let watcher: AssetWatcher;

  afterEach(async () => {
    if (watcher) {
      await watcher.close();
    }
  });

  it('should instantiate with srcRoot, outDir, and assets options', () => {
    watcher = new AssetWatcher({
      srcRoot: 'src',
      outDir: 'dist',
      assets: [{ include: '**/*.json' }],
    });
    expect(watcher).toBeDefined();
  });
});
