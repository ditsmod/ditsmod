import { Class, reflector } from '@ditsmod/core';

export function setAlias<T extends Class>(Cls: T, alias: string): InstanceType<T> {
  const newObj: any = {
    toString() {
      return `${reflector.getClassMetadata(Cls)[0]?.value} as ${alias}`;
    },
  };

  for (const key in new Cls()) {
    newObj[key] = `${alias}.${key}`;
  }

  return newObj;
}
