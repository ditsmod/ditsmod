import { AuthjsConfig } from '@ditsmod/authjs';
import credentials, { CredentialsConfig } from '@ditsmod/authjs/providers/credentials';
import { factoryMethod, injectable } from '@ditsmod/core';

@injectable()
export class OverriddenAuthConfig extends AuthjsConfig {
  override session: AuthjsConfig['session'] = { strategy: 'jwt' };

  override callbacks: AuthjsConfig['callbacks'] = {
    async jwt({ token, user, trigger }) {
      return token;
    },
    async session({ session, token }) {
      return session;
    },
  };

  @factoryMethod()
  initAuthjsConfig() {
    const credentialsConfig: Partial<CredentialsConfig> = {
      credentials: {
        username: { label: 'Username' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
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
