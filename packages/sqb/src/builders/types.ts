export interface RunCallback {
  $setRun(callback: (query: string, ...args: any[]) => any): unknown;
  $run<T = string>(...args: any[]): Promise<T>;
  $setEscape?(callback: (value: any) => string): unknown;
}
