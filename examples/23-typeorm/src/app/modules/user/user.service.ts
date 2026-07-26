import { injectable } from '@ditsmod/core';
import { injectRepository, injectDataSource } from '@ditsmod/typeorm';
import { Repository, DataSource } from 'typeorm';

import { UserEntity } from './user.entity.js';

@injectable()
export class UserService {
  constructor(
    @injectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @injectDataSource() private dataSource: DataSource,
  ) {}

  async findAll(): Promise<UserEntity[]> {
    return this.userRepo.find();
  }

  async create(userData: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.userRepo.create(userData);
    return this.userRepo.save(user);
  }

  /**
   * Demonstrates executing database operations inside a TypeORM transaction.
   */
  async createUsersInTransaction(usersData: Partial<UserEntity>[]): Promise<UserEntity[]> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const createdUsers: UserEntity[] = [];
      for (const data of usersData) {
        const user = transactionalEntityManager.create(UserEntity, data);
        const saved = await transactionalEntityManager.save(user);
        createdUsers.push(saved);
      }
      return createdUsers;
    });
  }
}
