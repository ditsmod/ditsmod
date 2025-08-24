import { AnyRootTypes, BuiltRouter, RouterRecord } from '@trpc/server/unstable-core-do-not-import';

export interface TrpcRootModule {
  getAppRouter<TRoot extends AnyRootTypes, TRecord extends RouterRecord>(): BuiltRouter<TRoot, any>;
}
