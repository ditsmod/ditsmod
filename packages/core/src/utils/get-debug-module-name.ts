import { ModRefId } from '#types/mix.js';
import { getModuleName } from './get-module-name.js';

const debugModuleNames = new Map<ModRefId, string>();
const debugModuleNameCounters = new Map<string, number>();

/**
 * This function returns unique names (at the process level) for imported
 * modules in a Ditsmod application. If, for example, two modules with
 * the same name are imported, this function will add an index to the name
 * of the second module, separated by a hyphen. Each import of `ModuleWithParams`
 * is distinguished by the reference to the object.
 * 
 * If you use this function in tests, remember to run
 * the `clearDebugModuleNames()` function before each test.
 */
export function getDebugModuleName(modRefId: ModRefId): string {
  const debugModuleName = debugModuleNames.get(modRefId);
  if (debugModuleName) {
    return debugModuleName;
  }

  const moduleName = getModuleName(modRefId);
  const count = debugModuleNameCounters.get(moduleName);
  let newDebugModuleName: string;
  if (count) {
    newDebugModuleName = `${moduleName}-${count + 1}`;
    debugModuleNameCounters.set(moduleName, count + 1);
  } else {
    newDebugModuleName = moduleName;
    debugModuleNameCounters.set(moduleName, 1);
  }
  debugModuleNames.set(modRefId, newDebugModuleName);
  return newDebugModuleName;
}

export function clearDebugModuleNames() {
  debugModuleNames.clear();
  debugModuleNameCounters.clear();
}
