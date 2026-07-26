import { AuthjsConfig } from '@ditsmod/authjs';
import credentials, { CredentialsConfig } from '@ditsmod/authjs/providers/credentials';
import { factoryMethod, injectable } from '@ditsmod/core';

@injectable()
export class OverriddenAuthConfig extends AuthjsConfig {
  override session: AuthjsConfig['session'] = { strategy: 'jwt' };

  override callbacks: AuthjsConfig['callbacks'] = {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  };

  @factoryMethod()
  initAuthjsConfig() {
    const credentialsConfig: Partial<CredentialsConfig> = {
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'johnsmith' },
        password: { label: 'Password', type: 'password', placeholder: 'password123' },
        email: { label: 'Email', type: 'email', placeholder: 'johnsmith@i.ua' },
      },

      authorize: async (formData: any) => {
        if (formData?.username === 'johnsmith' && formData?.password === 'password123') {
          return {
            name: formData.username,
            email: formData.email || 'johnsmith@i.ua',
            role: 'admin',
          };
        }

        return null;
      },
    };

    this.providers = [credentials(credentialsConfig)];

    return this; // It is important to return `this`, as it will be used as AuthjsConfig.
  }
}
