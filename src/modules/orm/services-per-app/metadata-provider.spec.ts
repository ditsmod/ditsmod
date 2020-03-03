import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';

import { OrmModule } from '../orm.module';
import { RootModule } from '../../../decorators/root-module';
import { AppFactory } from '../../../app-factory';
import { ModuleType } from '../../../decorators/module';
import { MetadataProvider } from './metadata-provider';
import { Logger } from '../../../types/logger';
import { MysqlEntity, MysqlColumn } from '../mapping/mysql-decorators';
import { MysqlService } from '../mapping/mysql.service';
import { MysqlDriver } from '../mapping/mysql.driver';

describe('EntityInjector', () => {
  class MockAppFactory extends AppFactory {
    injectorPerApp: ReflectiveInjector;
    prepareServerOptions(appModule: ModuleType) {
      return super.prepareServerOptions(appModule);
    }
  }

  describe('with some column settings', () => {
    abstract class SomeEntity {
      abstract prop1: boolean;
      abstract prop2: string;
    }

    enum EnumType {
      one,
      two
    }

    @MysqlEntity({ tableName: 'users' })
    class MysqlSomeEntity extends SomeEntity {
      @MysqlColumn({ isPrimaryColumn: true })
      id: number; // Number

      @MysqlColumn({ isPrimaryColumn: true })
      prop1: boolean; // Boolean
      @MysqlColumn()
      prop2: string; // String
      @MysqlColumn()
      prop3: string[]; // Array
      @MysqlColumn()
      prop4: [string, number]; // Array
      @MysqlColumn()
      prop5: []; // Array
      @MysqlColumn()
      prop6: EnumType; // Number
      @MysqlColumn()
      prop7: any; // Object
      @MysqlColumn()
      prop8: void; // undefined
      @MysqlColumn()
      prop9: never; // undefined
      @MysqlColumn()
      // tslint:disable-next-line: ban-types
      prop10: Object; // Object
      @MysqlColumn()
      prop11: object; // Object
      @MysqlColumn()
      prop12: unknown; // Object
    }

    it(`case 1`, () => {
      /**
       * Такі мепи будуть зберігатись у репозиторіях (теках), що називатимуться відповідно до баз даних із версіями.
       * Наприклад, `mysql-v5.7`, `sqlite-v3`, `oracle-v11`.
       */
      const mysql57Map = new Map([[SomeEntity, MysqlSomeEntity]]);
      /**
       * Перекладачі повинні мати контекст бази даних.
       */
      const injector = ReflectiveInjector.resolveAndCreate([Logger, MysqlService, MetadataProvider]);
      const mysqlDriver = injector.resolveAndInstantiate(MysqlDriver) as MysqlDriver;
      const map = mysqlDriver.loadMapping(mysql57Map);
      console.log(map);

      const modWithOptions = OrmModule.withOptions(mysql57Map);
      @RootModule({
        imports: [modWithOptions],
        exports: [modWithOptions],
        providersPerApp: [Logger]
      })
      class AppModule {}

      const appFactory = new MockAppFactory();

      expect(appFactory).toBeDefined();
      appFactory.prepareServerOptions(AppModule);
    });
  });
});
