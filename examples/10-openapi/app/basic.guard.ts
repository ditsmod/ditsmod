import { CanActivate, Request, Response, Status } from '@ditsmod/core';
import { Injectable } from '@ts-stack/di';

@Injectable()
export class BasicGuard implements CanActivate {
  constructor(private req: Request, private res: Response) {}

  canActivate() {
    const { authorization } = this.req.nodeReq.headers;
    if (!authorization) {
      return this.unauth();
    }
    const [,base64] = authorization.split(' ');
    if (base64 != 'ZGVtbzpwQDU1dzByZA==') {
      return this.unauth();
    }

    return true;
  }

  protected unauth() {
    this.res.nodeRes.setHeader('WWW-Authenticate', 'Basic realm="Access to the API endpoint"');
    return Status.UNAUTHORIZED;
  }
}
