# @ditsmod/typeorm

Integrates [TypeORM](https://typeorm.io/) into Ditsmod applications. It provides seamless `DataSource` management, automatic entity registration, connection retries during application bootstrap, dependency injection decorators for repositories, and graceful connection shutdown.

## Installation

```bash
npm i @ditsmod/typeorm typeorm
```

## Quick Start

### 1. Configure Connection in Root Module

Import `TypeormModule.forRoot()` in your root module (`AppModule`) and attach feature modules via `appends`:

```ts
import { restRootModule } from '@ditsmod/rest';
import { TypeormModule } from '@ditsmod/typeorm';
import { UserModule } from './user.module.js';

@restRootModule({
  appends: [UserModule],
  imports: [
    TypeormModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'my_db',
      synchronize: true,
      autoLoadEntities: true, // Automatically registers entities passed to forFeature()
    }),
  ],
})
export class AppModule {}
```

### 2. Register Entities in Feature Modules

In your feature module, call `TypeormModule.forFeature()` with an array of entity classes or schemas (both entity classes and `EntitySchema` instances are supported; tree entities automatically receive a `TreeRepository`):

```ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

```ts
import { restModule } from '@ditsmod/rest';
import { TypeormModule } from '@ditsmod/typeorm';
import { User } from './user.entity.js';
import { UserController } from './user.controller.js';

@restModule({
  imports: [TypeormModule.forFeature([User])],
  controllers: [UserController],
})
export class UserModule {}
```

### 3. Inject Repositories

Inject entity repositories into your controllers or services using `@injectRepository(Entity)`:

```ts
import { controller, route } from '@ditsmod/rest';
import { injectRepository } from '@ditsmod/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';

@controller()
export class UserController {
  constructor(@injectRepository(User) private userRepo: Repository<User>) {}

  @route('GET', 'users')
  async getUsers() {
    return this.userRepo.find();
  }

  @route('POST', 'users')
  async createUser() {
    const user = this.userRepo.create({ name: 'Alice' });
    return this.userRepo.save(user);
  }
}
```

## Injecting `DataSource` or `EntityManager`

You can inject the initialized `DataSource` or `EntityManager` instances directly:

```ts
import { controller, route } from '@ditsmod/rest';
import { injectDataSource, injectEntityManager } from '@ditsmod/typeorm';
import { DataSource, EntityManager } from 'typeorm';

@controller()
export class SystemController {
  constructor(
    @injectDataSource() private dataSource: DataSource,
    @injectEntityManager() private entityManager: EntityManager,
  ) {}

  @route('GET', 'db-status')
  getStatus() {
    return { isConnected: this.dataSource.isInitialized };
  }
}
```

---

## Multiple Databases

To connect to multiple databases, call `forRoot()` multiple times with unique `name` properties:

```ts
// AppModule.ts
@restRootModule({
  imports: [
    TypeormModule.forRoot({
      type: 'postgres',
      database: 'main_db',
      autoLoadEntities: true,
    }),
    TypeormModule.forRoot({
      name: 'analytics',
      type: 'postgres',
      database: 'analytics_db',
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

Register entities for the specific database in feature modules by specifying the `dataSourceName`:

```ts
import { restModule } from '@ditsmod/rest';

@restModule({
  imports: [TypeormModule.forFeature([LogEntity], 'analytics')],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
```

Inject repositories or data sources for named databases:

```ts
@controller()
export class AnalyticsController {
  constructor(
    @injectRepository(LogEntity, 'analytics') private logRepo: Repository<LogEntity>,
    @injectDataSource('analytics') private analyticsDs: DataSource,
  ) {}
}
```

---

## Configuration Options

`TypeormModuleOptions` extends TypeORM's native `DataSourceOptions` with additional Ditsmod-specific properties:

| Option                 | Type                               | Default     | Description                                                                                      |
| ---------------------- | ---------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `name`                 | `string`                           | `'default'` | Identifier for named `DataSource` instances (multi-database setups).                             |
| `autoLoadEntities`     | `boolean`                          | `true`      | Automatically includes entities registered via `forFeature()` into the connection configuration. |
| `retryAttempts`        | `number`                           | `9`         | Number of attempts to reconnect during bootstrap if database connection fails.                   |
| `retryDelay`           | `number`                           | `3000`      | Delay (in milliseconds) between connection retries.                                              |
| `toRetry`              | `(err: any) => boolean`            | —           | Predicate function to determine if a connection failure should be retried.                       |
| `verboseRetryLog`      | `boolean`                          | `false`     | Enables detailed logging of error stacks during connection retries.                              |
| `manualInitialization` | `boolean`                          | `false`     | When set to `true`, disables automatic connection initialization during bootstrap.               |
| `dataSourceFactory`    | `(options) => Promise<DataSource>` | —           | Custom factory function for instantiating the `DataSource`.                                      |

---

## Graceful Shutdown

Connections registered via `TypeormModule.forRoot()` are managed by `DataSourceManager`, which implements `OnShutdown`. When the Ditsmod application stops, all active connections are cleanly destroyed.
