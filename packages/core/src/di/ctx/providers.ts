import { input } from '#di/decorators.js';
import { ctx } from '#di/ctx/decorators.js';
import type { Provider } from '#di/top/types-and-models.js';
import { Context } from './context.js';
import { Injector } from '#di/injector.js';

/**
 * Providers required for `Context` service and the `ctx` parameter decorator to work. These providers need
 * to be added to each injector where `Context` is used, i.e. when there is a need to set certain context data.
 */
export const ctxProviders: Provider[] = [
  Context,
  {
    token: ctx,
    deps: [Context, input, Injector],
    useFactory: (context: Context, key: any, injector: Injector) => context.getInScope(key, injector),
  },
];
