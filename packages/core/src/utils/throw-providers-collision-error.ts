export function throwProvidersCollisionError(moduleName: string, duplicates: any[], modulesNames: string[] = []) {
  const namesArr = duplicates.map((p) => p.name || p);
  const namesStr = namesArr.join(', ');
  let fromModules = 'from several modules ';
  let example = '';
  if (modulesNames.length) {
    fromModules = `from ${modulesNames.join(', ')} `;
    example = ` For example: resolvedCollisionsPerApp: [ [${namesArr[0]}, ${modulesNames[0]}] ]`;
  }
  const provider = duplicates.length > 1 ? 'these providers' : 'this provider';
  const msg =
    `Importing providers to ${moduleName} failed: exports ${fromModules}causes collision with ${namesStr}. ` +
    `You should manually add ${provider} to "resolvedCollisionsPer*" in ${moduleName}.${example}`;
  throw new Error(msg);
}
