import { dirname } from 'node:path';

/**
 * Taken from https://github.com/sindresorhus/caller-callsite
 */
export class CallsiteUtils {
  /**
   * Use this method very carefully, it works unreliable.
   */
  static getCallerDir() {
    const callsites = this.callerCallsite({ depth: 0 });
    const rawPath = callsites?.getFileName() || '';
    const path = rawPath.startsWith('file:///') ? rawPath.slice(7) : rawPath;
    // console.log('=== result:', path);
    return dirname(path);
  }

  protected static callerCallsite({ depth = 0 } = {}) {
    const callers = [];
    const callerFileSet = new Set();
    const sliceOfCallsites = this.callsites();
    let startListen = false;
    const hasClassDecorFactory = sliceOfCallsites.some((c) => c.getFunctionName() == 'classDecorFactory');
    // this.debug(sliceOfCallsites);

    for (let i = 0; i < sliceOfCallsites.length; i++) {
      const callsite = sliceOfCallsites[i];
      const fileName = callsite.getFileName();

      if (!callerFileSet.has(fileName) && !fileName?.startsWith('node:internal/')) {
        callerFileSet.add(fileName);
        callers.unshift(callsite);
      }

      if (callsite.getFunctionName() == 'classDecorFactory') {
        startListen = true; // This mean - expect next row
        continue;
      }

      if (
        (startListen && callsite.getFunctionName() === null) ||
        (!hasClassDecorFactory && callsite.getTypeName() === null)
      ) {
        return callers[depth];
      }
    }
    return;
  }

  protected static debug(sliceOfCallsites: NodeJS.CallSite[]) {
    const arr = sliceOfCallsites.map((c) => {
      return {
        getFileName: c.getFileName(),
        getFunctionName: c.getFunctionName(),
        getTypeName: c.getTypeName(),
        getMethodName: c.getMethodName(),
      };
    });
    console.table(arr);
  }

  /**
   * Taken from https://github.com/sindresorhus/callsites
   */
  protected static callsites() {
    const _prepareStackTrace = Error.prepareStackTrace;
    const originStackTraceLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 50;
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
      Error.stackTraceLimit = originStackTraceLimit;
      Error.prepareStackTrace = _prepareStackTrace;
    }
  }
}
