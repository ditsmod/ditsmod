export const DEBUG_NAME = 'debugName';

export function stringify(token: any): string {
  if (typeof token == 'string') {
    return token;
  }

  if (token == null) {
    return '' + token;
  }

  if (token[DEBUG_NAME]) {
    return `${token[DEBUG_NAME]}`;
  }

  if (token.name) {
    return `${token.name}`;
  }

  if (token.module) {
    return `${token.module.name}-withParams`;
  }

  const res = token.toString();

  if (res == null) {
    return '' + res;
  }

  const newLineIndex = res.indexOf('\n');
  return newLineIndex === -1 ? res : res.substring(0, newLineIndex);
}
