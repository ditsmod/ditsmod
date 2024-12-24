import { injectable } from '@ditsmod/core';

@injectable()
export class CredentialsService {
  async authorize(data: any) {
    if (typeof data?.username == 'string') {
      const { username: name } = data;
      return { name: name, email: name.replace(' ', '') + '@example.com' };
    }
    return null;
  }
}
