import { injectable } from '@ditsmod/core';

interface User {
  username?: string;
  name?: string;
  email?: string;
}

@injectable()
export class CredentialsService {
  async authorize(user?: User): Promise<User | null> {
    if (typeof user?.username == 'string') {
      const { username: name } = user;
      return { name, email: name.replace(' ', '') + '@example.com' };
    }
    return null;
  }
}
