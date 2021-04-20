export function getLogMethod(level: string, ...args: any[]) {
  const [arg1, ...rest] = args;
  this.logger[level](arg1, ...rest);
}
