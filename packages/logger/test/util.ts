export function getPathFile(filename: string) {
  return filename.replace('dist-test/test', 'test').replace('.spec.js', '.spec.ts');
}
