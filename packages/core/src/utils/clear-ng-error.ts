/**
 * This function clears @ts-stack/di specific errors.
 */
export function clearNgError(err: any) {
  if (err.hasOwnProperty('ngOriginalError')) {
    // This is @ts-stack/di specific error
    delete err.addKey;
    delete err.keys;
    delete err.injectors;
    delete err.constructResolvingMessage;
    delete err.ngOriginalError;
  }
}
