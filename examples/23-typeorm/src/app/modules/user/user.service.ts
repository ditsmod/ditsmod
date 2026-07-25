import { injectable } from '@ditsmod/core';
import { injectRepository, injectDataSource } from '@ditsmod/typeorm';
import { Repository, DataSource } from 'typeorm';

import { User } from './user.entity.js';

@injectable()
export class UserService {
  constructor(
    @injectRepository(User) private userRepo: Repository<User>,
    @injectDataSource() private dataSource: DataSource,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepo.create(userData);
    return this.userRepo.save(user);
  }

  /**
   * Demonstrates executing database operations inside a TypeORM transaction.
   */
  async createUsersInTransaction(usersData: Partial<User>[]): Promise<User[]> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const createdUsers: User[] = [];
      for (const data of usersData) {
        const user = transactionalEntityManager.create(User, data);
        const saved = await transactionalEntityManager.save(user);
        createdUsers.push(saved);
      }
      return createdUsers;
    });
  }
}
