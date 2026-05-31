import { factoryMethod } from '@ditsmod/core';

import { AuthjsConfig } from '#mod/authjs.config.js';
import type { CredentialsConfig } from '#mod/providers/credentials.js';
import credentials from '#mod/providers/credentials.js';

export class OverriddenAuthConfig extends AuthjsConfig {
  override secret = 'secret';

  @factoryMethod()
  initAuthjsConfig() {
    const credentialsConfig: Partial<CredentialsConfig> = {
      credentials: {
        username: { label: 'Username' },
      },

      authorize: async (formData: any) => {
        if (typeof formData?.username == 'string') {
          const { username: name } = formData;
          return { name, email: name.replace(' ', '') + '@example.com' };
        }
        return null;
      },
    };

    this.providers = [credentials(credentialsConfig)];

    return this; // It is important to return `this`, it will be used as a `AuthjsConfig`.
  }
}
