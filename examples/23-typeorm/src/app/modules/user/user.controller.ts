import { ctx } from '@ditsmod/core';
import { controller, route, RequestContext } from '@ditsmod/rest';
import { HTTP_BODY } from '@ditsmod/body-parser';

import { UserService } from './user.service.js';
import { UserEntity } from './user.entity.js';

@controller()
export class UserController {
  constructor(private userService: UserService) {}

  @route('GET', 'users')
  async getUsers() {
    return this.userService.findAll();
  }

  @route('POST', 'users')
  async createUser(ctx: RequestContext, @ctx(HTTP_BODY) body: Partial<UserEntity>) {
    const userData = body?.name ? body : { name: 'Alice', email: 'alice@example.com' };
    return this.userService.create(userData);
  }

  @route('POST', 'users/batch')
  async createUsersBatch(ctx: RequestContext, @ctx(HTTP_BODY) body: Partial<UserEntity>[]) {
    const usersData =
      Array.isArray(body) && body.length > 0
        ? body
        : [
            { name: 'Bob', email: 'bob@example.com' },
            { name: 'Charlie', email: 'charlie@example.com' },
          ];
    return this.userService.createUsersInTransaction(usersData);
  }
}
