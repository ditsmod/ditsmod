import { controller, route } from '@ditsmod/rest';
import { InjectRepository } from '@ditsmod/typeorm';
import type { Repository } from 'typeorm';

import { User } from './user.entity.js';

@controller()
export class UserController {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  @route('GET', 'users')
  async getUsers() {
    return this.userRepo.find();
  }

  @route('POST', 'users')
  async createUser() {
    const user = this.userRepo.create({
      name: 'Alice',
      email: 'alice@example.com',
    });
    return this.userRepo.save(user);
  }
}
