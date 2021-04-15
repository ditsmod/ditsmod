import { Injectable } from '@ts-stack/di';
import { HttpHandler, HttpInterceptor, Request } from '@ditsmod/core';

@Injectable()
export class CorsInterceptor implements HttpInterceptor {
  constructor(private req: Request) {}

  intercept(next: HttpHandler) {
    this.req.nodeRes.setHeader('access-control-allow-headers', 'Content-Type, api_key, Authorization');
    this.req.nodeRes.setHeader('access-control-allow-methods', 'GET, POST, DELETE, PUT');
    this.req.nodeRes.setHeader('access-control-allow-origin', '*');
    return next.handle();
  }
}
