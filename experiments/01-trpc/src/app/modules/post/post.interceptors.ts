import { injectable, Logger } from '@ditsmod/core';
import { CanActivate, RequestContext, HttpInterceptor, HttpHandler } from '@ditsmod/trpc';

export class Guard implements CanActivate {
  canActivate(ctx: RequestContext) {
    return true;
  }
}

@injectable()
export class MyHttpInterceptor implements HttpInterceptor {
  constructor(private logger: Logger) {}

  async intercept(next: HttpHandler, ctx: RequestContext) {
    const originalMsg = await next.handle(); // Handling request to `HelloWorldController`
    return originalMsg;
  }
}
