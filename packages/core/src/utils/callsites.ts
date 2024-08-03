import { dirname } from 'node:path';

/**
 * Taken from https://github.com/sindresorhus/caller-callsite
 */
export function callerCallsite({ depth = 0 } = {}) {
  const callers = [];
  const callerFileSet = new Set();
  const sliceOfCallsites = callsites();

  for (let i = 0; i < sliceOfCallsites.length; i++) {
    const callsite = sliceOfCallsites[i];
    const fileName = callsite.getFileName();
    const hasReceiver = callsite.getTypeName() !== null && fileName !== null;

    if (!callerFileSet.has(fileName) && !fileName?.startsWith('node:internal/')) {
      callerFileSet.add(fileName);
      callers.unshift(callsite);
    }

    if (hasReceiver || sliceOfCallsites.length == i + 1) {
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
  return dirname(callsites?.getFileName() || '');
}
