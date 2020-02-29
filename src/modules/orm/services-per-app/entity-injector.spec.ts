import 'reflect-metadata';
import { ReflectiveInjector } from '@ts-stack/di';

import { OrmModule } from '../orm.module';
import { Entity } from '../decorators/entity';
import { Column } from '../decorators/column';
import { RootModule } from '../../../decorators/root-module';
import { AppFactory } from '../../../app-factory';
import { ModuleType } from '../../../decorators/module';
import { EntityInjector } from './entity-injector';

fdescribe('EntityInjector', () => {
  class MockAppFactory extends AppFactory {
    injectorPerApp: ReflectiveInjector;
    prepareServerOptions(appModule: ModuleType) {
      return super.prepareServerOptions(appModule);
    }
  }

  describe('with some column settings', () => {
    class SomeEntity {
      fistName: string;
    }

    enum EnumType {
      one,
      two
    }

    @Entity({ tableName: 'users' })
    class MysqlEntity extends SomeEntity {
      @Column({ isPrimaryColumn: true })
      id: number; // Number

      @Column({ isPrimaryColumn: true })
      prop1: boolean; // Boolean
      @Column()
      prop2: string; // String
      @Column()
      prop3: string[]; // Array
      @Column()
      prop4: [string, number]; // Array
      @Column()
      prop5: []; // Array
      @Column()
      prop6: EnumType; // Number
      @Column()
      prop7: any; // Object
      @Column()
      prop8: void; // undefined
      @Column()
      prop9: never; // undefined
      @Column()
      // tslint:disable-next-line: ban-types
      prop10: Object; // Object
      @Column()
      prop11: object; // Object
      @Column()
      prop12: unknown; // Object
    }

    it(`case 1`, () => {
      const entities = [{ provide: SomeEntity, useClass: MysqlEntity }];
      const modWithOptions = OrmModule.withOptions(entities);
      @RootModule({
        imports: [modWithOptions],
        exports: [modWithOptions]
      })
      class AppModule {}

      const appFactory = new MockAppFactory();

      expect(appFactory).toBeDefined();
      const { optsMap, injectorPerReqMap } = appFactory.prepareServerOptions(AppModule);
      const injectorPerReq = injectorPerReqMap.get(AppModule);
      const entityInjector = injectorPerReq.get(EntityInjector);
    });
  });
});
