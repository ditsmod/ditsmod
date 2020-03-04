import { User } from '3-orm/app/entities/user';
import { ORM } from '@ts-stack/mod';

const { MysqlEntity, MysqlColumn } = ORM;

@MysqlEntity({ tableName: 'user' })
export class MysqlUser extends User {
  @MysqlColumn({ isPrimaryColumn: true })
  userId: number;
  @MysqlColumn()
  userName: string;
}
