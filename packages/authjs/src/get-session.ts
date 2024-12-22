import { Auth, createActionURL, setEnvDefaults } from '@auth/core';
import type { AuthConfig, Session } from '@auth/core/types';
import { Req } from '@ditsmod/core';

export type GetSessionResult = Promise<Session | null>;

export async function getSession(req: Req, config: AuthConfig): GetSessionResult {
  setEnvDefaults(process.env, config);
  const url = createActionURL(
    'session',
    req.protocol,
    // @ts-expect-error description here
    new Headers(req.rawReq.headers),
    process.env,
    config,
  );

  const response = await Auth(new Request(url, { headers: { cookie: req.rawReq.headers.cookie ?? '' } }), config);

  const { status = 200 } = response;

  const data = await response.json();

  if (!data || !Object.keys(data).length) return null;
  if (status === 200) return data;
  throw new Error(data.message);
}
