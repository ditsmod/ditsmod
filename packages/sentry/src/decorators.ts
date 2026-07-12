import { SEMANTIC_ATTRIBUTE_SENTRY_OP, SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, isThenable } from '@sentry/core';
import type { MonitorConfig } from '@sentry/core';
import * as Sentry from '@sentry/node';

import { HttpStatus } from '@ditsmod/core';
import { isCustomError } from '@ditsmod/core/errors';
import type { CustomError } from '@ditsmod/core/errors';

/**
 * Determines if the exception is an expected Ditsmod control flow or client error.
 * An ErrorInfo with status < 500 and level='warn'|'debug'|'info' is "expected".
 */
export function isExpectedError(exception: unknown): boolean {
  if (isCustomError(exception)) {
    const { status = HttpStatus.INTERNAL_SERVER_ERROR, level = 'warn' } = (exception as CustomError).info;
    if (status < HttpStatus.INTERNAL_SERVER_ERROR && (level === 'warn' || level === 'debug' || level === 'info')) {
      return true;
    }
  }
  return false;
}

/**
 * A decorator wrapping a cron/scheduled job method, sending check-ins to Sentry.
 */
export const sentryCron = (monitorSlug: string, monitorConfig?: MonitorConfig): MethodDecorator => {
  return (target: unknown, propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = function (...args: unknown[]) {
      return Sentry.withMonitor(
        monitorSlug,
        () => {
          return originalMethod.apply(this, args);
        },
        monitorConfig,
      );
    };

    copyFunctionNameAndMetadata({ originalMethod, descriptor });

    return descriptor;
  };
};

/**
 * A decorator usable to wrap arbitrary functions with spans.
 */
export function sentryTraced(op: string = 'function') {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown> | unknown;

    descriptor.value = function (...args: unknown[]) {
      return Sentry.startSpan(
        {
          op: op,
          name: propertyKey,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: 'auto.function.ditsmod.sentry_traced',
            [SEMANTIC_ATTRIBUTE_SENTRY_OP]: op,
          },
        },
        () => {
          return originalMethod.apply(this, args);
        },
      );
    };

    copyFunctionNameAndMetadata({ originalMethod, descriptor });

    return descriptor;
  };
}

/**
 * A decorator to capture exceptions thrown by decorated methods and report them to Sentry.
 */
export function sentryExceptionCaptured() {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown> | unknown;

    descriptor.value = function (...args: unknown[]) {
      try {
        const result = originalMethod.apply(this, args);
        if (isThenable(result)) {
          return result.then(undefined, (exception) => {
            if (!isExpectedError(exception)) {
              Sentry.captureException(exception, {
                mechanism: { handled: false, type: 'auto.function.ditsmod.exception_captured' },
              });
            }
            throw exception;
          });
        }
        return result;
      } catch (exception) {
        if (!isExpectedError(exception)) {
          Sentry.captureException(exception, {
            mechanism: { handled: false, type: 'auto.function.ditsmod.exception_captured' },
          });
        }
        throw exception;
      }
    };

    copyFunctionNameAndMetadata({ originalMethod, descriptor });

    return descriptor;
  };
}

/**
 * Copies the function name and metadata from the original method to the decorated method.
 */
function copyFunctionNameAndMetadata({
  originalMethod,
  descriptor,
}: {
  descriptor: PropertyDescriptor;
  originalMethod: (...args: unknown[]) => unknown;
}): void {
  Object.defineProperty(descriptor.value, 'name', {
    value: originalMethod.name,
    configurable: true,
    enumerable: true,
    writable: true,
  });

  if (typeof Reflect !== 'undefined' && typeof Reflect.getMetadataKeys === 'function') {
    const originalMetaData = Reflect.getMetadataKeys(originalMethod);
    for (const key of originalMetaData) {
      const value = Reflect.getMetadata(key, originalMethod);
      Reflect.defineMetadata(key, value, descriptor.value);
    }
  }
}
