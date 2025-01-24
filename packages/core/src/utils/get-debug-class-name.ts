import { ModRefId } from '#types/mix.js';
import { isModuleWithParams } from './type-guards.js';

const debugClassNames = new Map<ModRefId, string>();
const debugClassNameCounters = new Map<string, number>();

/**
 * Returns unique names (at the process level) for given
 * classes or modules in a Ditsmod application. If, for example, two modules with
 * the same name are imported, this function will add an index to the name
 * of the second module, separated by a hyphen. Each import of `ModuleWithParams`
 * is distinguished by the reference to the object.
 * 
 * If you use this function in tests, remember to run
 * the `clearDebugClassNames()` function before each test.
 */
export function getDebugClassName(modRefId: ModRefId): string {
  const debugClassName = debugClassNames.get(modRefId);
  if (debugClassName) {
    return debugClassName;
  }

  let className: string;
  if (isModuleWithParams(modRefId)) {
    className = modRefId.id || modRefId.module.name;
  } else {
    className = modRefId.name;
  }
  const count = debugClassNameCounters.get(className);
  let newDebugClassName: string;
  if (count) {
    newDebugClassName = `${className}-${count + 1}`;
    debugClassNameCounters.set(className, count + 1);
  } else {
    newDebugClassName = className;
    debugClassNameCounters.set(className, 1);
  }
  debugClassNames.set(modRefId, newDebugClassName);
  return newDebugClassName;
}

export function clearDebugClassNames() {
  debugClassNames.clear();
  debugClassNameCounters.clear();
}
