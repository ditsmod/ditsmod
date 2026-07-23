import { resolveForwardRef, type ForwardRefFn } from '#di/forward-ref.js';
import type { ModRefId, StaticModule } from '#decorators/module-decorator-options.js';
import { isDynamicModule } from '#decorators/type-guards.js';

const debugClassNames = new WeakMap<ModRefId, string>();
const debugClassNameCounters = new Map<string, number>();

/**
 * Returns unique names (at the process level) for given
 * classes in a Ditsmod application. If, for example, two modules with
 * the same name are imported, this function will add an index to the name
 * of the second module, separated by a hyphen. Each import of `DynamicModule`
 * is distinguished by the reference to the object.
 *
 * Returns `undefined` if the passed argument is not a class and is not a module with parameters.
 *
 * If you use this function in tests, remember to run
 * the {@link clearDebugClassNames | clearDebugClassNames()} function before each test.
 */
export function getDebugClassName(modRefId: string | ModRefId | ForwardRefFn<StaticModule>): string | undefined {
  if (!modRefId) {
    return;
  } else if (typeof modRefId == 'string') {
    return modRefId;
  }
  modRefId = resolveForwardRef(modRefId);
  const debugClassName = debugClassNames.get(modRefId);
  if (debugClassName) return debugClassName;

  let className: string;
  if (isDynamicModule(modRefId)) {
    className = modRefId.id || `${resolveForwardRef(modRefId.module).name}-DynamicModule`;
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

/**
 * This function works in conjunction with the {@link getDebugClassName | getDebugClassName()} function.
 * It is necessary when performing tests.
 */
export function clearDebugClassNames() {
  debugClassNameCounters.clear();
}
