import { injectable, AnyFn, AnyObj, inject, Injector, Provider } from '@ditsmod/core';
import { MutationProcedure } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_OPTS, TRPC_ROOT } from '../constants.js';
import { TrpcRootObject } from '../types.js';

@injectable()
export class RouteService<Context extends AnyObj = AnyObj, Input = void> {
  procedure: TrpcRootObject<Context>['procedure'];

  constructor(
    @inject(TRPC_ROOT) public t: TrpcRootObject<any>,
    protected injectorPerRou: Injector,
    protected providersPerReq: Provider[],
  ) {
    this.procedure = t.procedure;
  }

  getMutation<R>(fn: AnyFn<any, R>) {
    return {
      procedure: this.procedure,
      mutation: (opts) => {
      const injectorPerReq = this.injectorPerRou.resolveAndCreateChild(
        this.providersPerReq.concat({ token: TRPC_OPTS, useValue: opts }),
      );
        return injectorPerReq.get(fn);
      },
    } as GetMutationType<Context>;
  }

  /**
   * @todo Implement a method so that `input()` occurs based on decorator metadata.
   */
  mutation<R = any>(fn: AnyFn<any, R>) {
    return this.procedure.mutation((opts) => {
      const injectorPerReq = this.injectorPerRou.resolveAndCreateChild(
        this.providersPerReq.concat({ token: TRPC_OPTS, useValue: opts }),
      );
      return injectorPerReq.get(fn);
    }) as unknown as MutationProcedure<{
      input: Input;
      output: R;
      meta: object;
    }>;
  }

  query<R>(fn: AnyFn<any, R>) {
    return this.procedure.query((opts) => {
      const injectorPerReq = this.injectorPerRou.resolveAndCreateChild(
        this.providersPerReq.concat({ token: TRPC_OPTS, useValue: opts }),
      );
      return injectorPerReq.get(fn);
    });
  }
}

export interface GetMutationType<Context extends AnyObj> {
  procedure: TrpcRootObject<Context>['procedure'];
  mutation: AnyFn;
}
