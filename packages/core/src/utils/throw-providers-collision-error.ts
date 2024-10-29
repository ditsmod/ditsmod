import { Scope } from '#types/mix.js';

export function throwProvidersCollisionError(
  moduleName: string,
  duplicates: any[],
  modulesNames: string[] = [],
  scope?: Scope,
  isExternal?: boolean,
) {
  const namesArr = duplicates.map((p) => p.name || p);
  const namesStr = namesArr.join(', ');
  let fromModules = 'from several modules ';
  let example = '';
  if (modulesNames.length) {
    fromModules = `from ${modulesNames.join(', ')} `;
    example = ` For example: resolvedCollisionsPer${scope || 'App'}: [ [${namesArr[0]}, ${modulesNames[0]}] ].`;
  }
  const resolvedCollisionsPer = scope ? `resolvedCollisionsPer${scope}` : 'resolvedCollisionsPer*';
  let msg = `Importing providers to ${moduleName} failed: exports ${fromModules}causes collision with ${namesStr}. `;
  if (!isExternal) {
    msg += `You should add ${namesStr} to ${resolvedCollisionsPer} in this module.${example}`;
  }
  throw new Error(msg);
}
