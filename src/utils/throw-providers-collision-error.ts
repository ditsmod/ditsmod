export function throwProvidersCollisionError(moduleName: string, duplicates: any[]) {
  const names = duplicates.map((p) => p.name || p).join(', ');
  const provider = duplicates.length > 1 ? 'these providers' : 'this provider';
  throw new Error(
    `Exporting providers to ${moduleName} was failed: found collision for: ${names}. You should manually add ${provider} to ${moduleName}.`
  );
}
