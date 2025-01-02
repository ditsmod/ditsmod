import { AuthjsConfig } from '@ditsmod/authjs';
import credentials, { CredentialsConfig } from '@ditsmod/authjs/providers/credentials';
import { factoryMethod } from '@ditsmod/core';

export class OverriddenAuthConfig extends AuthjsConfig {
  override basePath = '/auth';
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
