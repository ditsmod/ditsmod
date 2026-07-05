import { ProcessManager } from './process-manager.js';

describe('ProcessManager', () => {
  let manager: ProcessManager;

  afterEach(async () => {
    if (manager) {
      await manager.stop();
    }
  });

  it('should instantiate with default options', () => {
    manager = new ProcessManager();
    expect(manager).toBeDefined();
  });

  it('should instantiate with custom exec, killTimeout, and nodeArgs', () => {
    manager = new ProcessManager({
      exec: 'node',
      killTimeout: 2000,
      nodeArgs: ['--enable-source-maps'],
    });
    expect(manager).toBeDefined();
  });

  it('should stop cleanly when no process is running', async () => {
    manager = new ProcessManager();
    await expect(manager.stop()).resolves.toBeUndefined();
  });
});
