import { injectable, Logger } from '@ditsmod/core';
import { TrpcCanActivate, TrpcHttpInterceptor, TrpcHttpHandler, TrpcOpts, trpcGuard } from '@ditsmod/trpc';

@trpcGuard()
export class Guard implements TrpcCanActivate {
  canActivate(opts: TrpcOpts) {
    return true;
  }
}

@injectable()
export class MyHttpInterceptor implements TrpcHttpInterceptor {
  constructor(private logger: Logger) {}

  async intercept(next: TrpcHttpHandler, opts: TrpcOpts) {
    const originalMsg = await next.handle(); // Handling request to `HelloWorldController`
    return originalMsg;
  }
}
