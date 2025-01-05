type resolveFn<T> = (value: T | PromiseLike<T>) => void;
type rejectFn = (reason?: any) => void;

export function createDeferred<T>() {
  let resolve!: resolveFn<T>;
  let reject!: rejectFn;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
