# TypeORM Example

Demonstrates how to integrate TypeORM into a Ditsmod REST application using `@ditsmod/typeorm`.

## Features Demonstrated

- **Root Connection Setup**: `TypeormModule.forRoot()` configured for MySQL in `AppModule`.
- **Native `.env` Support**: Environment variables (`MYSQL_HOST`, `MYSQL_PORT`, etc.) loaded natively via Node's `--env-file=.env`.
- **Feature Entity Registration**: `TypeormModule.forFeature([User])` configured in `UserModule`.
- **Repository Injection**: `@injectRepository(User)` injected in `UserController`.
- **DataSource & EntityManager Injection**: `@injectDataSource()` and `@injectEntityManager()` injected in `SystemController`.
- **Routed Feature Modules**: `appends: [UserModule, SystemModule]` configured in `AppModule`.

## Running the Example

Copy or rename `example.env` to `.env` and set your database connection parameters before running the example:

```bash
cp example.env .env
yarn --cwd examples/23-typeorm start
```

## Running Tests

```bash
yarn --cwd examples/23-typeorm test
```
