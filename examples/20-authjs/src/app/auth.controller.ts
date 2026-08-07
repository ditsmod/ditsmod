import { controller, route, RequestContext } from '@holu/rest';
import { AuthjsConfig, AUTHJS_SESSION, AuthjsGuard, AuthjsInterceptor, getSession } from '@holu/authjs';
import { ctx } from '@holu/core';

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
      <h1>Holu Auth.js Example</h1>
      <p><strong>Test Credentials:</strong> Username: <code>johnsmith</code> | Password: <code>password123</code></p>
      <ul>
        <li><a href="/auth/signin?callbackUrl=/status">Sign in</a></li>
        <li><a href="/profile">Protected Profile (requires auth)</a></li>
        <li><a href="/status">Public Status (optional auth)</a></li>
        <li><a href="/auth/signout">Sign out</a></li>
      </ul>
    `;
  }
}
