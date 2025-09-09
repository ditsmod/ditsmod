import { injectable, Logger } from '@ditsmod/core';
import { CanActivate, HttpInterceptor, HttpHandler, TrpcOpts, trpcGuard } from '@ditsmod/trpc';

@trpcGuard()
export class Guard implements CanActivate {
  canActivate(opts: TrpcOpts) {
    return true;
  }
}

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  async intercept(next: HttpHandler, opts: TrpcOpts) {
    const originalMsg = await next.handle(); // Handling request to `HelloWorldController`
    return originalMsg;
  }
}
