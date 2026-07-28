// scripts/run-jest.mjs
import * as jest from 'jest';

// Transform CLI arguments:
// Replace paths containing "/src/" or "src/" with "/dist/" or "dist/"
// and ".ts" extensions with ".js" for tests
const args = process.argv.slice(2).map((arg) => {
  if (/(^|\/)src\//.test(arg) && arg.endsWith('.ts')) {
    return arg
      .replace(/(^|\/)src\//, '$1dist/')
      .replace(/\.ts$/, '.js');
  }
  return arg;
});

// Run Jest in the current process with all preserved Node.js flags
jest.run(args);
