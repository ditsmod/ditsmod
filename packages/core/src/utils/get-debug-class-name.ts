import { ForwardRefFn, resolveForwardRef } from '#di';
import { ModRefId, ModuleType } from '#types/mix.js';
import { isModuleWithParams } from './type-guards.js';

const debugClassNames = new Map<ModRefId, string>();
const debugClassNameCounters = new Map<string, number>();

/**
 * Returns unique names (at the process level) for given
 * classes in a Ditsmod application. If, for example, two modules with
 * the same name are imported, this function will add an index to the name
 * of the second module, separated by a hyphen. Each import of `ModuleWithParams`
 * is distinguished by the reference to the object.
 *
 * Returns `undefined` if the passed argument is not a class and is not a module with parameters.
 *
 * If you use this function in tests, remember to run
 * the `clearDebugClassNames()` function before each test.
 */
export function getDebugClassName(modRefId: ModRefId | ForwardRefFn<ModuleType>): string | undefined {
  modRefId = resolveForwardRef(modRefId);
  const debugClassName = debugClassNames.get(modRefId);
  if (debugClassName) {
    return debugClassName;
  }

  let className: string;
  if (isModuleWithParams(modRefId)) {
    className = modRefId.id || `${modRefId.module.name}-WithParams`;
  } else {
    className = modRefId.name;
  }
  if (!className) {
    return;
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
