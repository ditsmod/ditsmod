export function deepFreeze<T extends any>(obj: T): T {
  if (!obj) {
    return;
  }

  const props = Object.getOwnPropertyNames(obj);

  for (const name of props) {
    const value = obj[name];

    if (value && typeof value == 'object') {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}
