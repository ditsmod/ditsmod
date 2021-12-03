import { Scope } from '../types/mix';

export function throwProvidersCollisionError(
  moduleName: string,
  duplicates: any[],
  modulesNames: string[] = [],
  scope?: Scope
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
  const provider = duplicates.length > 1 ? 'these providers' : 'this provider';
  const msg =
    `Importing providers to ${moduleName} failed: exports ${fromModules}causes collision with ${namesStr}. ` +
    `You should add ${provider} to ${resolvedCollisionsPer} in ${moduleName}.${example}`;
  throw new Error(msg);
}
