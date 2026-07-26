import { controller, route, RequestContext } from '@ditsmod/rest';
import { AuthjsConfig, AUTHJS_SESSION, AuthjsGuard, AuthjsInterceptor, getSession } from '@ditsmod/authjs';
import { ctx } from '@ditsmod/core';

@controller()
export class AuthController {
  constructor(protected config: AuthjsConfig) {}

  @route('POST', 'auth/:action/:providerId', [], [AuthjsInterceptor])
  auth() {
    return 'ok';
  }

  @route('GET', 'profile', [AuthjsGuard])
  getProfile(@ctx(AUTHJS_SESSION) session: any) {
    return session.user;
  }

  @route('GET', 'status')
  async getStatus(ctx: RequestContext) {
    const session = await getSession(ctx, this.config);
    if (session) {
      return { status: 'logged in', user: session.user };
    }
    return { status: 'guest', message: 'You are not logged in' };
  }

  @route('GET')
  home(ctx: RequestContext) {
    ctx.rawRes.setHeader('content-type', 'text/html; charset=utf-8');
    return `
      <h1>Ditsmod Auth.js Example</h1>
      <ul>
        <li><a href="/auth/signin">Sign in</a></li>
        <li><a href="/profile">Protected Profile (requires auth)</a></li>
        <li><a href="/status">Public Status (optional auth)</a></li>
        <li><a href="/auth/signout">Sign out</a></li>
      </ul>
    `;
  }
}
