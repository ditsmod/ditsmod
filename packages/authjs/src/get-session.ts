import { Auth, createActionURL, setEnvDefaults } from '@auth/core';
import type { AuthConfig, Session } from '@auth/core/types';
import type { RequestContext } from '@ditsmod/core';

export type GetSessionResult = Promise<Session | null>;

export async function getSession(ctx: RequestContext, config: AuthConfig): GetSessionResult {
  setEnvDefaults(process.env, config);
  const url = createActionURL(
    'session',
    ctx.protocol,
    new Headers(ctx.rawReq.headers as HeadersInit),
    process.env,
    config,
  );

  const request = new Request(url, { headers: { cookie: ctx.rawReq.headers.cookie ?? '' } });
  const response = await Auth(request, config);
  const { status = 200 } = response;
  const data = await response.json();

  if (!data || !Object.keys(data).length) {
    return null;
  }
  if (status == 200) {
    return data;
  }
  throw new Error(data.message);
}
