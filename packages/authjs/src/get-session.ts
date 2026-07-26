import { Auth, createActionURL, setEnvDefaults } from '@auth/core';
import type { GetSessionResult, ReqForSession } from './types.js';
import type { AuthjsConfig } from './authjs.config.js';

export async function getSession(req: ReqForSession, config: AuthjsConfig): GetSessionResult {
  setEnvDefaults(process.env, config);
  const headers = new Headers();
  Object.entries(req.rawReq.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => v && headers.append(key, v));
      return;
    }
    if (value) {
      headers.append(key, value);
    }
  });

  const url = createActionURL('session', req.protocol, headers, process.env, config);

  const request = new Request(url, { headers });
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
