export interface RunOptions {
  first?: boolean;
}

export interface NoSqlActions {
  /**
   * Constructs an additional part of the SQL query that is passed to the `callback`
   * parameter if the `condition` parameter is a true expression.
   */
  $if(condition: any, callback: (cb: unknown) => unknown): unknown;
  /**
   * Sets a hook that can be executed using the `$runHook()` method. Typically,
   * this hook is used to implement integration with a database driver. For example,
   * it can run an external service that makes a query to the database.
   */
  $setHook(callback: (query: string, ...args: any[]) => any): unknown;
  /**
   * Executed a hook that was set using the `$setHook()` method.
   *
   * @param opts Options for an SQL database.
   * @param args Arguments for an SQL query.
   */
  $runHook<R = string, O extends object = any>(opts?: O, ...args: any[]): Promise<R>;
  /**
   * Sets the callback for escaping special characters in a SQL text expression.
   */
  $setEscape(callback: (value: any) => string): unknown;
}

export type TableAndAlias<T> = T | `${Extract<T, string>} as ${string}`;
