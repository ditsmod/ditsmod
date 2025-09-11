import { z } from 'zod';
import { AnyObj, inject, injectable, Injector, ResolvedProvider, ClassFactoryProvider } from '@ditsmod/core';
import type {
  AnyMiddlewareFunction,
  TRPCMutationProcedure,
  TRPCQueryProcedure,
  TRPCProcedureBuilder,
} from '@trpc/server';
import { ParserWithInputOutput, UnsetMarker } from '@trpc/server/unstable-core-do-not-import';

import { TRPC_ROOT } from '#types/constants.js';
import { TrpcOpts } from '#types/types.js';
import { TrpcRootObject } from '#types/types.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';

@injectable()
export class TrpcRouteService<Context extends AnyObj = AnyObj, Input = void> {
  /**
   * This procedure builder should be used when you perform input validation directly in the code instead of in interceptors.
   */
  get procedure() {
    return this.#procedure.use(this.middlewarePerRou()) as TRPCProcedureBuilder<
      Context,
      object,
      object,
      UnsetMarker,
      Input extends void ? UnsetMarker : Input,
      UnsetMarker,
      UnsetMarker,
      false
    >;
  }
  /**
   * This procedure builder should be used when input validation takes place automatically in interceptors.
   */
  get procedureAfterInput() {
    return this.#procedure.input(z.any()).use(this.middlewarePerRou()) as TRPCProcedureBuilder<
      Context,
      object,
      object,
      UnsetMarker,
      Input extends void ? UnsetMarker : Input,
      UnsetMarker,
      UnsetMarker,
      false
    >;
  }
  protected middlewarePerRou: () => AnyMiddlewareFunction;
  protected handlerPerReq: (opts: TrpcOpts) => any;
  protected resolvedPerReq: ResolvedProvider[];
  protected routeMeta: TrpcRouteMeta;
  #procedure: TrpcRootObject<Context>['procedure'];

  constructor(
    @inject(TRPC_ROOT) protected t: TrpcRootObject<any>,
    protected injectorPerRou: Injector,
  ) {
    this.#procedure = t.procedure;
  }

  /**
   * Performs a `query` request using the DI injector. This means that this method
   * is not equivalent to `t.procedure.query()`. It also means that for this method to work correctly,
   * you must first provide a {@link ClassFactoryProvider } to DI in the following format:
   * 
```ts
{ useFactory: [YourService, YourService.prototype.methodName] }
```
   *
   * Then you can use its token in this method: `routeService.diQuery(YourService.prototype.methodName)`.
   * In this case, DI will create an instance of `YourService` and execute the specified method on each request.
   * 
   * @see [Example on github](https://github.com/ditsmod/ditsmod/blob/main/examples/18-trpc-server/src/app/modules/post/post.controller.ts)
   * 
   * @param methodAsToken Class method as a DI token in the format `ClassName.prototype.methodName`.
   */
  diQuery<R>(methodAsToken: (...args: any[]) => R) {
    const query = this.getHandler<R>(methodAsToken);
    return this.#procedure.query(query) as TRPCQueryProcedure<{
      input: Input;
      output: R;
      meta: AnyObj;
    }>;
  }

  /**
   * Performs a `query` request using the DI injector. This means that this method
   * is not equivalent to `t.procedure.query()`. It also means that for this method to work correctly,
   * you must first provide a {@link ClassFactoryProvider } to DI in the following format:
   * 
```ts
{ useFactory: [YourService, YourService.prototype.methodName] }
```
   *
   * Then you can use its token in this method: `routeService.diInputAndQuery(z.any(), YourService.prototype.methodName)`.
   * In this case, DI will create an instance of `YourService` and execute the specified method on each request.
   * 
   * @see [Example on github](https://github.com/ditsmod/ditsmod/blob/main/examples/18-trpc-server/src/app/modules/post/post.controller.ts)
   * 
   * @param methodAsToken Class method as a DI token in the format `ClassName.prototype.methodName`.
   */
  diInputAndQuery<Input, Output, R>(
    input: ParserWithInputOutput<Input, Output>,
    methodAsToken: (...args: any[]) => R,
  ) {
    const query = this.getHandler<R>(methodAsToken);
    return this.#procedure.input(input).query(query) as TRPCQueryProcedure<{
      input: Input;
      output: R;
      meta: AnyObj;
    }>;
  }

  /**
   * Performs a `mutation` request using the DI injector. This means that this method
   * is not equivalent to `t.procedure.mutation()`. It also means that for this method to work correctly,
   * you must first provide a {@link ClassFactoryProvider } to DI in the following format:
   * 
```ts
{ useFactory: [YourService, YourService.prototype.methodName] }
```
   *
   * Then you can use its token in this method: `routeService.diMutation(YourService.prototype.methodName)`.
   * In this case, DI will create an instance of `YourService` and execute the specified method on each request.
   * 
   * @see [Example on github](https://github.com/ditsmod/ditsmod/blob/main/examples/18-trpc-server/src/app/modules/post/post.controller.ts)
   * 
   * @param methodAsToken Class method as a DI token in the format `ClassName.prototype.methodName`.
   */
  diMutation<R>(methodAsToken: (...args: any[]) => R) {
    const mutation = this.getHandler<R>(methodAsToken);
    return this.#procedure.input(z.any()).mutation(mutation) as TRPCMutationProcedure<{
      input: Input;
      output: R;
      meta: AnyObj;
    }>;
  }

  /**
   * Performs a `mutation` request using the DI injector. This means that this method
   * is not equivalent to `t.procedure.mutation()`. It also means that for this method to work correctly,
   * you must first provide a {@link ClassFactoryProvider } to DI in the following format:
   * 
```ts
{ useFactory: [YourService, YourService.prototype.methodName] }
```
   *
   * Then you can use its token in this method: `routeService.diInputAndMutation(z.any(), YourService.prototype.methodName)`.
   * In this case, DI will create an instance of `YourService` and execute the specified method on each request.
   * 
   * @see [Example on github](https://github.com/ditsmod/ditsmod/blob/main/examples/18-trpc-server/src/app/modules/post/post.controller.ts)
   * 
   * @param methodAsToken Class method as a DI token in the format `ClassName.prototype.methodName`.
   */
  diInputAndMutation<Input, Output, R>(
    input: ParserWithInputOutput<Input, Output>,
    methodAsToken: (...args: any[]) => R,
  ) {
    const mutation = this.getHandler<R>(methodAsToken);
    return this.#procedure.input(input).mutation(mutation) as TRPCMutationProcedure<{
      input: Input;
      output: R;
      meta: AnyObj;
    }>;
  }

  protected getHandler<R>(fn: (...args: any[]) => R) {
    const resolvedHandler = this.resolvedPerReq.find((rp) => rp.dualKey.token === fn);
    if (!resolvedHandler) {
      throw new Error(`${fn.name} not found in "providersPerReq" array`);
    }

    this.routeMeta.resolvedHandler = resolvedHandler;
    return this.handlerPerReq;
  }

  protected setHandlerPerReq(
    routeMeta: TrpcRouteMeta,
    resolvedPerReq: ResolvedProvider[],
    middlewarePerRou: () => AnyMiddlewareFunction,
    handlerPerReq: (opts: TrpcOpts) => any,
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
export class PublicTrpcRouteService extends TrpcRouteService {
  override setHandlerPerReq(
    routeMeta: TrpcRouteMeta,
    resolvedPerReq: ResolvedProvider[],
    middlewarePerRou: () => AnyMiddlewareFunction,
    handlerPerReq: (opts: TrpcOpts) => any,
  ) {
    return super.setHandlerPerReq(routeMeta, resolvedPerReq, middlewarePerRou, handlerPerReq);
  }
}
