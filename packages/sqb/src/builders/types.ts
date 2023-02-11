export interface RunOptions {
  first?: boolean;
}

export interface NoSqlActions {
  $if(condition: any, callback: (cb: unknown) => unknown): unknown;
  $setRun(callback: (query: string, ...args: any[]) => any): unknown;
  $run<R = string, O extends object = any>(opts?: O, ...args: any[]): Promise<R>;
  $setEscape(callback: (value: any) => string): unknown;
}

export type TableAndAlias<T> = T | `${Extract<T, string>} as ${string}`;
