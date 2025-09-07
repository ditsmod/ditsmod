import { z } from 'zod';
import { AnyFn, AnyObj, inject, injectable, Injector, ResolvedProvider } from '@ditsmod/core';
import type { TRPCMutationProcedure, TRPCQueryProcedure } from '@trpc/server';
import { ParserWithInputOutput } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_ROOT, TrpcOpts } from '#types/constants.js';
import { TrpcRootObject } from '#types/types.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';

@injectable()
export class RouteService<Context extends AnyObj = AnyObj, Input = void> {
  get procedure() {
    return this.#procedure.use(this.middlewarePerRou() as any);
  }
  protected middlewarePerRou: AnyFn<any, (opts: TrpcOpts) => Promise<any>>;
  protected handlerPerReq: <R>(opts: TrpcOpts) => Promise<R>;
  protected resolvedPerReq: ResolvedProvider[];
  protected routeMeta: TrpcRouteMeta;
  #procedure: TrpcRootObject<Context>['procedure'];

  constructor(
    @inject(TRPC_ROOT) protected t: TrpcRootObject<any>,
    protected injectorPerRou: Injector,
  ) {
    this.#procedure = t.procedure;
  }

  query<R>(fn: AnyFn<any, R>) {
    const query = this.getHandler<R>(fn);
    return this.#procedure.query(query as any) as TRPCQueryProcedure<{
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
    return this.#procedure.input(z.any()).mutation(mutation as any) as TRPCMutationProcedure<{
      input: Input;
      output: R;
      meta: AnyObj;
    }>;
  }

  inputAndMutation<Input, Output, R>(input: ParserWithInputOutput<Input, Output>, fn: AnyFn<any, R>) {
    const mutation = this.getHandler<R>(fn);
    return this.#procedure.input(input).mutation(mutation as any) as TRPCMutationProcedure<{
      input: Input;
      output: R;
      meta: AnyObj;
    }>;
  }

  protected getHandler<R>(fn: AnyFn<any, R>) {
    const resolvedHandler = this.resolvedPerReq.find((rp) => rp.dualKey.token === fn);
    if (!resolvedHandler) {
      throw new Error(`${fn.name} not found in "providersPerReq" array`);
    }

    this.routeMeta.resolvedHandler = resolvedHandler;
    return this.handlerPerReq<R>;
  }

  protected setHandlerPerReq(
    routeMeta: TrpcRouteMeta,
    resolvedPerReq: ResolvedProvider[],
    middlewarePerRou: AnyFn<any, (opts: TrpcOpts) => Promise<any>>,
    handlerPerReq: typeof this.handlerPerReq,
  ) {
    this.routeMeta = routeMeta;
    this.resolvedPerReq = resolvedPerReq;
    this.middlewarePerRou = middlewarePerRou;
    this.handlerPerReq = handlerPerReq;
  }
}

/**
 * Opens protected properties.
 */
export class PublicRouteService extends RouteService {
  override setHandlerPerReq(
    routeMeta: TrpcRouteMeta,
    resolvedPerReq: ResolvedProvider[],
    middlewarePerRou: AnyFn<any, (opts: TrpcOpts) => Promise<any>>,
    handlerPerReq: typeof this.handlerPerReq,
  ) {
    return super.setHandlerPerReq(routeMeta, resolvedPerReq, middlewarePerRou, handlerPerReq);
  }
}
