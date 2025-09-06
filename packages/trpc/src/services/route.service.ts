import { z } from 'zod';
import { AnyFn, AnyObj, inject, injectable, Injector, ResolvedProvider } from '@ditsmod/core';
import type { TRPCMutationProcedure, TRPCQueryProcedure } from '@trpc/server';
import { ParserWithInputOutput } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_ROOT, TrpcOpts } from '#types/constants.js';
import { TrpcRootObject } from '#types/types.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';

@injectable()
export class RouteService<Context extends AnyObj = AnyObj, Input = void> {
  procedure: TrpcRootObject<Context>['procedure'];
  protected handler: <R>(opts: TrpcOpts) => Promise<R>;
  protected resolvedPerReq: ResolvedProvider[];
  protected routeMeta: TrpcRouteMeta;

  constructor(
    @inject(TRPC_ROOT) protected t: TrpcRootObject<any>,
    protected injectorPerRou: Injector,
  ) {
    this.procedure = t.procedure;
  }

  query<R>(fn: AnyFn<any, R>) {
    const query = this.getHandler<R>(fn);
    return this.procedure.query(query) as TRPCQueryProcedure<{
      input: void;
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

  inputAndMutation<Input, Output, R>(input: ParserWithInputOutput<Input, Output>, fn: AnyFn<any, R>) {
    const mutation = this.getHandler<R>(fn);
    return this.procedure.input(input).mutation(mutation) as TRPCMutationProcedure<{
      input: Input;
      output: R;
      meta: AnyObj;
    }>;
  }

  protected getHandler<R>(fn: AnyFn<any, R>) {
    const resolvedHandler = this.resolvedPerReq.find((rp) => rp.dualKey.token === fn);
    if (!resolvedHandler) {
      throw new Error(`${fn.name} not found`);
    }

    this.routeMeta.resolvedHandler = resolvedHandler;
    return this.handler<R>;
  }

  protected setMetadata(routeMeta: TrpcRouteMeta, resolvedPerReq: ResolvedProvider[], handler: typeof this.handler) {
    this.routeMeta = routeMeta;
    this.resolvedPerReq = resolvedPerReq;
    this.handler = handler;
  }
}

/**
 * Opens protected properties.
 */
export class PublicRouteService extends RouteService {
  override setMetadata(routeMeta: TrpcRouteMeta, resolvedPerReq: ResolvedProvider[], handler: typeof this.handler) {
    return super.setMetadata(routeMeta, resolvedPerReq, handler);
  }
}
