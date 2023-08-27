import { ResolveHook } from 'node:module';
import jestConfig from './jest.config.js';

interface ModuleNameMapper {
  [key: string]: string | string[];
}
export type ModuleNameMap = [RegExp, string][];

const defaultRootDir = new URL(import.meta.url + '/../../').pathname;
const moduleNameMap = getModuleNameMap(jestConfig.moduleNameMapper);

/**
 * This function is used by Node.js as a hook when resolving module loading paths.
 */
export const resolve: ResolveHook = (alias, context, defaultResolver) => {
  const origin = resolveAlias(moduleNameMap, alias);
  if (origin) {
    return {
      url: new URL(origin, context.parentURL).href,
      format: origin.endsWith('.cjs') ? 'commonjs' : 'module',
      shortCircuit: true,
    };
  }
  return defaultResolver(alias, context);
};

export function getModuleNameMap(moduleNameMapper?: ModuleNameMapper, rootDir: string = defaultRootDir) {
  return Object.entries(moduleNameMapper || {}).map(([alias, origin]) => {
    if (Array.isArray(origin)) {
      throw new TypeError('An array in config path mapping for the Node.js loader is not supported!');
    }
    const resolvedRootDir = origin.replace('<rootDir>/', rootDir);
    return [RegExp('^' + alias), resolvedRootDir];
  }) as ModuleNameMap;
}

export function resolveAlias(moduleNameMap: ModuleNameMap, specifier: string) {
  for (const [alias, origin] of moduleNameMap) {
    const execArr = alias.exec(specifier);
    if (execArr) {
      const result = execArr.slice(1).reduce((result, replaceValue, i) => {
        const searchValue = '$' + (i + 1);
        return result.replaceAll(searchValue, replaceValue);
      }, origin);

      return /\.(?:c|m)?js$/.test(result) ? result : `${result}/index.js`;
    }
  }
  return false;
}
