import { dirname } from 'node:path';

/**
 * Taken from https://github.com/sindresorhus/caller-callsite
 */
export function callerCallsite({ depth = 0 } = {}) {
  const callers = [];
  const callerFileSet = new Set();
  const sliceOfCallsites = callsites();
  // const allPaths = sliceOfCallsites.map(c => {    
  //   return `${c.getMethodName()}, ${c.getTypeName()}, ${c.getFunctionName()}, ${c.getFileName()}`;
  // });
  // console.log('*'.repeat(20), allPaths);

  for (let i = 0; i < sliceOfCallsites.length; i++) {
    const callsite = sliceOfCallsites[i];
    const fileName = callsite.getFileName();

    if (!callerFileSet.has(fileName) && !fileName?.startsWith('node:internal/')) {
      callerFileSet.add(fileName);
      callers.unshift(callsite);
    }

    if (callsite.getFunctionName() === null) {
      return callers[depth];
    }
  }
  return;
}

/**
 * Taken from https://github.com/sindresorhus/callsites
 */
export function callsites() {
  const _prepareStackTrace = Error.prepareStackTrace;
  try {
    let result: NodeJS.CallSite[] = [];
    Error.prepareStackTrace = (_, callSites) => {
      const callSitesWithoutCurrent = callSites.slice(1);
      result = callSitesWithoutCurrent;
      return callSitesWithoutCurrent;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    new Error().stack;
    return result;
  } finally {
    Error.prepareStackTrace = _prepareStackTrace;
  }
}

export function getCallerDir() {
  const callsites = callerCallsite({ depth: 0 });
  const rawPath = callsites?.getFileName() || '';
  const path = rawPath.startsWith('file:///') ? rawPath.slice(8) : rawPath;
  return dirname(path);
}
