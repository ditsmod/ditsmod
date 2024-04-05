export interface RunOptions {
  first?: boolean;
}

export interface NoSqlActions {
  $if(condition: any, callback: (cb: unknown) => unknown): unknown;
  $setHook(callback: (query: string, ...args: any[]) => any): unknown;
  $runHook<R = string, O extends object = any>(opts?: O, ...args: any[]): Promise<R>;
  $setEscape(callback: (value: any) => string): unknown;
}

export type TableAndAlias<T> = T | `${Extract<T, string>} as ${string}`;
