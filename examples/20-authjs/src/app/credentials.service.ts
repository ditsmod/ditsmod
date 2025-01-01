import { injectable } from '@ditsmod/core';
import { CredentialsConfig } from '@ditsmod/authjs/providers/credentials';

@injectable()
export class CredentialsService {
  get credentials(): CredentialsConfig['credentials'] {
    return {
      username: { label: 'Username' },
      password: { label: 'Your password', type: 'password' },
      iAgree: { label: 'I agree', type: 'checkbox' },
    };
  }

  authorize: CredentialsConfig['authorize'] = async (data: any) => {
    if (typeof data?.username == 'string') {
      const { username: name } = data;
      return { name: name, email: name.replace(' ', '') + '@example.com' };
    }
    return null;
  };
}
