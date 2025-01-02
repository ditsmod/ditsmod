import type { AuthConfig } from '@auth/core';
import { Provider } from '@auth/core/providers';

/**
 * Configure the {@link https://authjs.dev/reference/core#auth | Auth method}.
 */
export class AuthjsConfig implements Omit<AuthConfig, 'raw'> {
  providers: Provider[] = [];
  declare adapter?: AuthConfig['adapter'];
  declare basePath?: AuthConfig['basePath'];
  declare callbacks?: AuthConfig['callbacks'];
  declare cookies?: AuthConfig['cookies'];
  declare debug?: AuthConfig['debug'];
  declare events?: AuthConfig['events'];
  declare experimental?: AuthConfig['experimental'];
  declare jwt?: AuthConfig['jwt'];
  declare logger?: AuthConfig['logger'];
  declare pages?: AuthConfig['pages'];
  declare redirectProxyUrl?: AuthConfig['redirectProxyUrl'];
  declare secret?: AuthConfig['secret'];
  declare session?: AuthConfig['session'];
  declare skipCSRFCheck?: AuthConfig['skipCSRFCheck'];
  declare theme?: AuthConfig['theme'];
  declare trustHost?: AuthConfig['trustHost'];
  declare useSecureCookies?: AuthConfig['useSecureCookies'];
}
