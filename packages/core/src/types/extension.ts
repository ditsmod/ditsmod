export interface Extension<T = any> {
  init(...args: any): T | Promise<T>;
}
