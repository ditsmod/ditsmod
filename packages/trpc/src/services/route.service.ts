import { injectable, AnyFn, AnyObj, inject, Injector, Provider } from '@ditsmod/core';
import { z } from 'zod';
import type { MutationProcedure } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_OPTS, TRPC_ROOT, TrpcOpts } from '../constants.js';
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
      mutation: (opts: TrpcOpts) => this.handle<R>(opts, fn),
    } as GetMutationType<Context, R>;
  }

  /**
   * @todo Implement a method so that `input()` occurs based on decorator metadata.
   */
  mutation<R>(fn: AnyFn<any, R>) {
    return this.procedure.input(z.any()).mutation((opts) => this.handle<R>(opts, fn)) as MutationProcedure<{
      input: Input;
      output: R;
      meta: object;
    }>;
  }

  query<R>(fn: AnyFn<any, R>) {
    return this.procedure.query((opts) => this.handle<R>(opts, fn));
  }

  protected handle<R>(opts: TrpcOpts, fn: AnyFn<any, R>): R {
    return this.injectorPerRou
      .resolveAndCreateChild(this.providersPerReq.concat({ token: TRPC_OPTS, useValue: opts }))
      .get(fn);
  }
}

export interface GetMutationType<Context extends AnyObj, R> {
  procedure: TrpcRootObject<Context>['procedure'];
  mutation: AnyFn<[TrpcOpts], R>;
}
