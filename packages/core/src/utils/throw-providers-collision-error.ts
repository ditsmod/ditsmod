export function throwProvidersCollisionError(moduleName: string, duplicates: any[], moduleNames: string[] = []) {
  const names = duplicates.map((p) => p.name || p).join(', ');
  const moduleNamesStr = moduleNames.length ? `inside ${moduleNames.join(', ')} ` : '';
  const provider = duplicates.length > 1 ? 'these providers' : 'this provider';
  throw new Error(
    `Exporting providers to ${moduleName} was failed: ${moduleNamesStr}found collision with ${names}. You should manually add ${provider} to ${moduleName}.`
  );
}
