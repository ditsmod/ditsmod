import { z } from 'zod';
import { AnyFn, AnyObj, inject, injectable, Injector } from '@ditsmod/core';
import type { TRPCMutationProcedure, TRPCQueryProcedure } from '@trpc/server';
import { ParserWithInputOutput } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_OPTS, TrpcOpts } from '../constants.js';
import { RawRequest, RawResponse, TrpcRootObject } from '../types.js';

@injectable()
export class RouteService<Context extends AnyObj = AnyObj, Input = void> {
  procedure: TrpcRootObject<Context>['procedure'];
  handler: (rawReq: RawRequest, rawRes: RawResponse) => Promise<void>;

  constructor(
    @inject(TRPC_OPTS) public t: TrpcRootObject<any>,
    protected injectorPerRou: Injector,
  ) {
    this.procedure = t.procedure;
  }

  inputAndMutation<Input, Output, R>(input: ParserWithInputOutput<Input, Output>, fn: AnyFn<any, R>) {
    const mutation = this.getHandler<R>(fn);
    return { input, mutation } as unknown as TRPCMutationProcedure<{
      input: Input;
      output: R;
      meta: AnyObj;
    }>;
  }

  /**
   * @todo Implement a method so that `input()` occurs based on decorator metadata.
   */
  mutation<R>(fn: AnyFn<any, R>) {
    const mutation = this.getHandler<R>(fn);
    return this.procedure.input(z.any()).mutation(mutation) as TRPCMutationProcedure<{
      input: Input;
      output: R;
      meta: AnyObj;
    }>;
  }

  query<R>(fn: AnyFn<any, R>) {
    const query = this.getHandler<R>(fn);
    return this.procedure.query(query) as TRPCQueryProcedure<{
      input: void;
      output: R;
      meta: AnyObj;
    }>;
  }

  protected getHandler<R>(fn: AnyFn<any, R>) {
    return (opts: TrpcOpts) => opts;
  }
}
