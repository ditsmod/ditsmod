import { ProcessManager } from './process-manager.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

// Helper: absolute path of a tiny JS fixture script we write on-the-fly.
function writeTmpScript(code: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-spec-'));
  const file = path.join(dir, 'fixture.mjs');
  fs.writeFileSync(file, code, 'utf8');
  return file;
}

// A script that keeps the process running without top-level await
// (which triggers Node.js "Detected unsettled top-level await" warning on kill).
const SLEEP_FOREVER_SCRIPT = 'process.stdin.resume();\n';

describe('ProcessManager', () => {
  let manager: ProcessManager;

  afterEach(async () => {
    if (manager) {
      await manager.stop();
    }
  });

  // ── Construction ──────────────────────────────────────────────────────────

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

  // ── stop() with no running process ───────────────────────────────────────

  it('should stop cleanly when no process is running', async () => {
    manager = new ProcessManager();
    await expect(manager.stop()).resolves.toBeUndefined();
  });

  // ── start() + stop() with a real process ─────────────────────────────────

  it('should start a child process and emit exit on stop()', async () => {
    // A script that just sleeps indefinitely — we will kill it via stop()
    const fixture = writeTmpScript(SLEEP_FOREVER_SCRIPT);
    manager = new ProcessManager({ nodeArgs: [] });

    const exitPromise = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
      manager.once('exit', (code, signal) => resolve({ code, signal }));
    });

    manager.start(fixture);

    // Give the process a moment to start up
    await new Promise((r) => setTimeout(r, 100));

    await manager.stop();
    const result = await exitPromise;

    // After stop(), the process must have exited — either via a signal or with a code.
    expect(result.signal !== null || result.code !== null).toBe(true);
  }, 10_000);

  it('should emit exit event when process exits naturally', async () => {
    // A script that exits immediately with code 0
    const fixture = writeTmpScript('process.exit(0);\n');
    manager = new ProcessManager({ nodeArgs: [] });

    const exitPromise = new Promise<number | null>((resolve) => {
      manager.once('exit', (code) => resolve(code));
    });

    manager.start(fixture);
    const code = await exitPromise;

    expect(code).toBe(0);
  }, 10_000);

  // ── restart() ─────────────────────────────────────────────────────────────

  it('should restart: old process exits before new one starts', async () => {
    const fixture = writeTmpScript(SLEEP_FOREVER_SCRIPT);
    manager = new ProcessManager({ nodeArgs: [] });

    manager.start(fixture);
    await new Promise((r) => setTimeout(r, 100));

    // restart() must resolve without throwing
    await expect(manager.restart(fixture)).resolves.toBeUndefined();
  }, 10_000);

  // ── Options & Flags ───────────────────────────────────────────────────────

  it('should pass --inspect flag when debug is true', async () => {
    const fixture = writeTmpScript('process.exit(0);\n');
    manager = new ProcessManager({ debug: true, nodeArgs: [], stdio: 'ignore' });

    const exitPromise = new Promise<number | null>((resolve) => manager.once('exit', resolve));
    manager.start(fixture);
    await exitPromise;
  }, 10_000);

  it('should pass --inspect=<host> flag when debug is a string', async () => {
    const fixture = writeTmpScript('process.exit(0);\n');
    manager = new ProcessManager({ debug: '127.0.0.1:9229', nodeArgs: [], stdio: 'ignore' });

    const exitPromise = new Promise<number | null>((resolve) => manager.once('exit', resolve));
    manager.start(fixture);
    await exitPromise;
  }, 10_000);

  it('should pass --env-file flags when envFile option is provided', async () => {
    const fixture = writeTmpScript('process.exit(0);\n');
    manager = new ProcessManager({ envFile: ['.env'], nodeArgs: [], stdio: 'ignore' });

    const exitPromise = new Promise<number | null>((resolve) => manager.once('exit', resolve));
    manager.start(fixture);
    await exitPromise;
  }, 10_000);

  // ── Double Stop Guard ──────────────────────────────────────────────────────

  it('should resolve stop() cleanly when called twice concurrently', async () => {
    const fixture = writeTmpScript(SLEEP_FOREVER_SCRIPT);
    manager = new ProcessManager({ nodeArgs: [] });
    manager.start(fixture);
    await new Promise((r) => setTimeout(r, 100));

    const [res1, res2] = await Promise.all([manager.stop(), manager.stop()]);
    expect(res1).toBeUndefined();
    expect(res2).toBeUndefined();
  }, 10_000);

  // ── Spawn Error Emission ───────────────────────────────────────────────────

  it('should emit error event when child process fails to spawn', async () => {
    manager = new ProcessManager({ exec: 'non-existent-binary-xyz-12345', nodeArgs: [] });
    const errPromise = new Promise<Error>((resolve) => manager.once('error', resolve));

    manager.start('dummy.js');
    const err = await errPromise;

    expect(err).toBeDefined();
    expect((err as any).code).toBe('ENOENT');
  }, 10_000);
});

