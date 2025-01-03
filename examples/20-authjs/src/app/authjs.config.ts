import { AuthjsConfig } from '@ditsmod/authjs';
import credentials, { CredentialsConfig } from '@ditsmod/authjs/providers/credentials';
import { factoryMethod } from '@ditsmod/core';

export class OverriddenAuthConfig extends AuthjsConfig {
  @factoryMethod()
  initAuthjsConfig() {
    const credentialsConfig: Partial<CredentialsConfig> = {
      credentials: {
        username: { label: 'Username' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Your password', type: 'password' },
        iAgree: { label: 'I agree', type: 'checkbox' },
      },

      authorize: async (formData: any) => {
        if (formData?.iAgree) {
          // Validation, transformation here.
          return { name: formData?.username, email: formData?.email }; // This returns as session data.
        }

        // When access is denied.
        return null;
      },
    };

    this.providers = [credentials(credentialsConfig)];

    return this; // It is important to return `this`, it will be used as a `AuthjsConfig`.
  }
}
