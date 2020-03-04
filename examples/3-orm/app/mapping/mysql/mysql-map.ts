import { Type } from '@ts-stack/di';
import { ORM } from '@ts-stack/mod';

import { User } from '3-orm/app/entities/user';
import { MysqlUser } from './entities/user';

export const mysqlMap = new Map<ORM.EntityModel, Type<any>>([
  //
  [User, MysqlUser]
]);
