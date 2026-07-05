import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';

export interface ProcessManagerOptions {
  /**
   * Binary to run. Defaults to `'node'`.
   */
  exec?: string;

  /**
   * Enable Node.js debug mode (`--inspect` or `--inspect=hostport`).
   */
  debug?: boolean | string;

  /**
   * Environment files to load via Node.js `--env-file` option.
   */
  envFile?: string[];

  /**
   * Arguments passed to `node` before the entry file.
   * Defaults to `['--enable-source-maps']`.
   */
  nodeArgs?: string[];

  /**
   * Time in ms to wait for the process to exit gracefully after SIGTERM
   * before sending SIGKILL. Defaults to 5000.
   */
  killTimeout?: number;
}

/**
 * Manages the lifecycle of the application child process.
 *
 * Features:
 * - Graceful shutdown: SIGTERM → wait `killTimeout` ms → SIGKILL
 * - Kills the **entire process group** (via negative PID) to clean up workers
 * - Returns a Promise on `restart()` that resolves only after the old process
 *   has fully exited, preventing EADDRINUSE errors.
 *
 * Emits:
 * - `exit` (code: number | null, signal: NodeJS.Signals | null)
 * - `error` (err: Error)
 */
export class ProcessManager extends EventEmitter {
  private current: ChildProcess | null = null;
  private stoppingPromise: Promise<void> | null = null;
  private readonly exec: string;
  private readonly debug?: boolean | string;
  private readonly envFile?: string[];
  private readonly nodeArgs: string[];
  private readonly killTimeout: number;

  constructor(options: ProcessManagerOptions = {}) {
    super();
    this.exec = options.exec ?? 'node';
    this.debug = options.debug;
    this.envFile = options.envFile;
    this.nodeArgs = options.nodeArgs ?? ['--enable-source-maps'];
    this.killTimeout = options.killTimeout ?? 5000;
  }

  /**
   * Starts the application process with optional application arguments.
   */
  start(entryFile: string, appArgs: string[] = []): void {
    this.current = this.spawnProcess(entryFile, appArgs);
  }

  /**
   * Gracefully stops the running process (if any) and starts a fresh one.
   * Awaits full termination before spawning to prevent port conflicts.
   */
  async restart(entryFile: string, appArgs: string[] = []): Promise<void> {
    await this.stop();
    this.current = this.spawnProcess(entryFile, appArgs);
  }

  /**
   * Gracefully terminates the current process and waits for it to exit.
   */
  stop(): Promise<void> {
    if (!this.current || this.current.exitCode !== null) {
      this.current = null;
      return Promise.resolve();
    }

    if (this.stoppingPromise) {
      return this.stoppingPromise;
    }

    this.stoppingPromise = new Promise((resolve) => {
      const proc = this.current!;

      const done = () => {
        clearTimeout(killTimer);
        this.current = null;
        this.stoppingPromise = null;
        resolve();
      };

      proc.once('exit', done);
      proc.once('error', done);

      // Try graceful shutdown first (allows the app to flush connections)
      this.killProcessGroup(proc, 'SIGTERM');

      // Force-kill after timeout if it has not exited yet
      const killTimer = setTimeout(() => {
        if (proc.exitCode === null) {
          this.killProcessGroup(proc, 'SIGKILL');
        }
      }, this.killTimeout);
      killTimer.unref();
    });

    return this.stoppingPromise;
  }

  private spawnProcess(entryFile: string, appArgs: string[] = []): ChildProcess {
    const isNode = this.exec === 'node';
    let spawnNodeArgs = [...this.nodeArgs];

    if (isNode) {
      if (this.debug) {
        const inspectFlag = typeof this.debug === 'string' ? `--inspect=${this.debug}` : '--inspect';
        spawnNodeArgs.unshift(inspectFlag);
      }
      if (this.envFile?.length) {
        const envFlags = this.envFile.map((f) => `--env-file=${f}`);
        spawnNodeArgs.unshift(...envFlags);
      }
    }

    const spawnArgs = isNode
      ? [...spawnNodeArgs, entryFile, ...appArgs]
      : [entryFile, ...appArgs];

    const proc = spawn(this.exec, spawnArgs, {
      stdio: 'inherit',
      // Assign a dedicated process group so we can kill all child workers too
      detached: true,
    });
    proc.unref();

    proc.on('exit', (code, signal) => {
      this.emit('exit', code, signal);
    });

    proc.on('error', (err) => {
      this.emit('error', err);
    });

    return proc;
  }

  /**
   * Sends a signal to the entire process group of `proc`.
   * On POSIX systems, negating the PID kills all processes in the same group.
   * On Windows this falls back to killing the process directly.
   */
  private killProcessGroup(proc: ChildProcess, signal: NodeJS.Signals): void {
    if (proc.pid == null) {
      return;
    }

    try {
      if (process.platform === 'win32') {
        proc.kill(signal);
      } else {
        // Negative PID → entire process group
        process.kill(-proc.pid, signal);
      }
    } catch {
      // Process may have already exited — ignore ESRCH
    }
  }
}
