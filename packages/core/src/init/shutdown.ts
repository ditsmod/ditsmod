export interface BeforeShutdown {
  beforeShutdown(signal?: string): void | Promise<void>;
}

export interface OnShutdown {
  onShutdown(signal?: string): void | Promise<void>;
}

export const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGUSR2', 'SIGQUIT'];
