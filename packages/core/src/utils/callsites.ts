import { dirname } from 'node:path';
import { type CallSiteObject, getCallSites } from 'node:util';

export class CallsiteUtils {
  /**
   * Use this method very carefully, works only from inside `/di/reflector.[js|ts]` file.
   *
   * @param functionName The name of the function inside which this method is called.
   */
  static getCallerDir() {
    const callsites = this.callerCallsite();
    const rawPath = callsites?.scriptName || '';
    const path = rawPath.startsWith('file:///') ? rawPath.slice(7) : rawPath;
    // console.log('=== result:', path);
    return dirname(path);
  }

  protected static callerCallsite() {
    const callSites = getCallSites();
    // this.debug(callSites);
    for (let i = 0; i < callSites.length; i++) {
      if (callSites[i].scriptName.includes('/di/reflector.')) {
        return callSites[i+1];
      }
    }
    return;
  }

  protected static debug(callSites: CallSiteObject[]) {
    const arr = callSites.map((c) => {
      return {
        scriptName: c.scriptName,
        functionName: c.functionName,
        lineNumber: c.lineNumber,
      };
    });
    console.table(arr);
  }
}
