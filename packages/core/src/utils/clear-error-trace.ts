import { DiError } from '../di';
import { PreRouterExtension } from '../extensions/pre-router.extension';

export function clearErrorTrace(error: any) {
  // In first line we have stack with "PreRouterExtension.checkDeps()".
  const regExp = /Error: No provider for [^\n]+\n\s+ at PreRouterExtension.checkDeps/;

  if (error instanceof DiError && regExp.test((error as any).stack)) {
    Error.captureStackTrace(error, (PreRouterExtension as any).prototype.checkDeps);
  }
}
