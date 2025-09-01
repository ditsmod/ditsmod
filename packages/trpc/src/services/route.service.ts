import { injectable, AnyFn, AnyObj, inject, Injector, Provider } from '@ditsmod/core';
import { z } from 'zod';

import { TRPC_ROOT } from '../constants.js';
import { TrpcRootObject } from '../types.js';

@injectable()
export class RouteService<Context extends AnyObj = AnyObj> {
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
      mutation: () => {
        const injectorPerReq = this.injectorPerRou.resolveAndCreateChild(this.providersPerReq);
        return injectorPerReq.get(fn);
      },
    } as GetMutationType<Context>;
  }

  /**
   * @todo Implement a method so that `input()` occurs based on decorator metadata.
   */
  mutation<Input, R>(fn: AnyFn<any, R>) {
    return this.procedure.input(z.object({ title: z.string() })).mutation(() => {
      const injectorPerReq = this.injectorPerRou.resolveAndCreateChild(this.providersPerReq);
      return injectorPerReq.get(fn);
    });
  }

  query<R>(fn: AnyFn<any, R>) {
    return this.procedure.query(() => {
      const injectorPerReq = this.injectorPerRou.resolveAndCreateChild(this.providersPerReq);
      return injectorPerReq.get(fn);
    });
  }
}

export interface GetMutationType<Context extends AnyObj> {
  procedure: TrpcRootObject<Context>['procedure'];
  mutation: AnyFn;
}
