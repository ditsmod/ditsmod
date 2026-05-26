import type { Provider } from '../di.js';
import { Context } from './context.js';
import { input, ctx } from './decorators.js';

/**
 * Providers required for `Context` and the `ctx` parameter decorator to work. These providers need
 * to be added to each injector where `Context` is used, i.e. when there is a need to set certain context data.
 */
export const injectorCtxProviders: Provider[] = [
  Context,
  {
    token: ctx,
    deps: [Context, input],
    useFactory: (context: Context, token: any) => context.get(token),
  },
];