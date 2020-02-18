export function getStackTrace() {
  Error.captureStackTrace(this, getStackTrace);
  return this.stack.replace('Error:', 'Stack:');
}
