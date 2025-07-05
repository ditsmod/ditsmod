export function throwProvidersCollisionError(
  moduleName: string,
  duplicates: any[],
  modulesNames: string[] = [],
  level?: string,
  isExternal?: boolean,
) {
  const namesArr = duplicates.map((p) => p.name || p);
  const namesStr = namesArr.join(', ');
  let fromModules = 'from several modules ';
  let example = '';
  if (modulesNames.length) {
    fromModules = `from ${modulesNames.join(', ')} `;
    example = ` For example: resolvedCollisionsPer${level || 'App'}: [ [${namesArr[0]}, ${modulesNames[0]}] ].`;
  }
  const resolvedCollisionsPer = level ? `resolvedCollisionsPer${level}` : 'resolvedCollisionsPer*';
  let msg = `Importing providers to ${moduleName} failed: exports ${fromModules}causes collision with ${namesStr}. `;
  if (!isExternal) {
    msg += `You should add ${namesStr} to ${resolvedCollisionsPer} in this module.${example}`;
  }
  throw new Error(msg);
}
