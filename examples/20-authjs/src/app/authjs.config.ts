import { AuthjsConfig } from '@ditsmod/authjs';
import credentials, { CredentialsConfig } from '@ditsmod/authjs/providers/credentials';
import { factoryMethod, injectable } from '@ditsmod/core';

@injectable()
export class OverriddenAuthConfig extends AuthjsConfig {
  override session: AuthjsConfig['session'] = { strategy: 'jwt' };

  override callbacks: AuthjsConfig['callbacks'] = {
    async redirect({ url, baseUrl }) {
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/status`;
      }
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url, baseUrl).origin === baseUrl) {
        return url;
      }
      return `${baseUrl}/status`;
    },
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
        username: { label: 'Username (test: johnsmith)', type: 'text', placeholder: 'johnsmith' },
        password: { label: 'Password (test: password123)', type: 'password', placeholder: 'password123' },
        email: { label: 'Email (test: johnsmith@i.ua)', type: 'email', placeholder: 'johnsmith@i.ua' },
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
